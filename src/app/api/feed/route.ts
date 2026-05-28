import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Инициализация Prisma с адаптером
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const cityParam = searchParams.get("city");

    let lat: number | null = null;
    let lng: number | null = null;

    if (latParam && lngParam) {
      lat = parseFloat(latParam);
      lng = parseFloat(lngParam);
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      // Пользователь предоставил координаты. Используем формулу Гаверсинуса в SQL.
      // 6371 - радиус Земли в километрах

      const userIdCondition = userId ? Prisma.sql`AND "userId" != ${userId}` : Prisma.empty;

      // Возвращаем данные как сырые объекты (мы их скастим)
      const booksWithDistance = await prisma.$queryRaw`
        SELECT
          id,
          title,
          authors,
          thumbnail,
          tier,
          "conditionRating",
          "userId",
          (
            6371 * acos(
              LEAST(
                1.0,
                cos(radians(${lat})) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lng})) +
                sin(radians(${lat})) *
                sin(radians(latitude))
              )
            )
          ) AS distance
        FROM "Book"
        WHERE "isForExchange" = true
          AND "status" = 'AVAILABLE'
          ${userIdCondition}
        ORDER BY distance ASC
        LIMIT 50;
      `;

      return NextResponse.json({ success: true, books: booksWithDistance });

    } else {
      // Фолбэк-режим: нет координат. Возвращаем книги с фильтром по городу (если передан) или последние добавленные.
      const books = await prisma.book.findMany({
        where: {
          isForExchange: true,
          status: "AVAILABLE",
          // Исключаем книги текущего пользователя, если он авторизован
          ...(userId ? { userId: { not: userId } } : {}),
          // Если передан город, фильтруем по нему
          ...(cityParam ? { city: { equals: cityParam, mode: "insensitive" } } : {})
        },
        select: {
          id: true,
          title: true,
          authors: true,
          thumbnail: true,
          tier: true,
          conditionRating: true,
          userId: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      });

      return NextResponse.json({ success: true, books });
    }
  } catch (error) {
    console.error("Ошибка при получении ленты:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
