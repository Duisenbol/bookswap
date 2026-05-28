"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AddBookFlow } from "@/components/AddBookFlow";

function LibraryContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimBook = searchParams.get("claimBook");

  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    // Если мы только что авторизовались и есть pendingBookData в localStorage,
    // открываем модалку для завершения публикации
    if (status === "authenticated" && claimBook === "true") {
      const pendingBook = localStorage.getItem("pendingBookData");
      if (pendingBook) {
        setTimeout(() => setIsAddBookModalOpen(true), 0);
      }
    }
  }, [status, claimBook]);

  const handleModalClose = () => {
    setIsAddBookModalOpen(false);
    localStorage.removeItem("pendingBookData");
    // Убираем параметр из URL
    router.replace("/library");
  };

  if (status === "loading" || status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center">Загрузка библиотеки...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Моя библиотека
          </h1>
          <p className="text-gray-500">
            Книги, которые вы добавили на личную полку
          </p>
        </header>

        <div className="bg-white p-12 text-center border border-dashed border-gray-300 rounded-2xl">
          <p className="text-gray-500">Здесь будут отображаться ваши личные книги.</p>
        </div>

      </div>

      {isAddBookModalOpen && (
        <AddBookFlow onClose={handleModalClose} />
      )}
    </main>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
