import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Инициализация Prisma с адаптером (как мы делали в auth.ts)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const session = await auth();

    // Проверка авторизации
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Обязательные поля для создания книги
    const {
      title,
      authors,
      description,
      thumbnail,
      googleBooksId,
      conditionComment,
      conditionRating,
      latitude,
      longitude,
      city
    } = body;

    if (!title || !authors || latitude === undefined || longitude === undefined || !city) {
      return NextResponse.json({ error: "Пропущены обязательные поля (title, authors, latitude, longitude, city)" }, { status: 400 });
    }

    // Используем транзакцию для безопасного добавления книги и проверки бонуса
    const result = await prisma.$transaction(async (tx) => {
      // 1. Создаем книгу. isForExchange: true чтобы выставить на обмен, status: AVAILABLE
      const newBook = await tx.book.create({
        data: {
          title,
          authors,
          description,
          thumbnail,
          googleBooksId,
          conditionComment,
          conditionRating,
          latitude,
          longitude,
          city,
          userId,
          isForExchange: true
        }
      });

      // 2. Получаем текущего пользователя для проверки условий бонуса
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { _count: { select: { books: true } } }
      });

      if (!user) {
        throw new Error("Пользователь не найден");
      }

      let bonusApplied = false;

      // 3. Логика начисления приветственного бонуса
      // Проверяем, что бонус еще не начислен, книг >= 3, и заданы базовые гео-данные пользователя
      if (
        !user.hasClaimedBonus &&
        user._count.books >= 3 &&
        user.latitude !== null &&
        user.longitude !== null
      ) {
        // Начисляем бонус
        await tx.user.update({
          where: { id: userId },
          data: {
            bronzeTokens: { increment: 1 },
            hasClaimedBonus: true
          }
        });
        bonusApplied = true;
      }

      return { newBook, bonusApplied };
    });

    return NextResponse.json({
      success: true,
      book: result.newBook,
      bonusApplied: result.bonusApplied
    }, { status: 201 });

  } catch (error) {
    console.error("Ошибка при создании книги:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
