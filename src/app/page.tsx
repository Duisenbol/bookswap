"use client";

import { useEffect, useState } from "react";
import { BookCard, SkeletonCard, type FeedBook } from "@/components/BookCard";
import { MapPinOff } from "lucide-react";

export default function Home() {
  const [books, setBooks] = useState<FeedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    // Функция загрузки ленты
    const fetchFeed = async (lat?: number, lng?: number) => {
      try {
        setLoading(true);
        let url = "/api/feed";
        if (lat !== undefined && lng !== undefined) {
          url += `?lat=${lat}&lng=${lng}`;
        }
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setBooks(data.books);
        } else {
          console.error("Ошибка API ленты:", data.error);
        }
      } catch (error) {
        console.error("Сетевая ошибка при загрузке ленты:", error);
      } finally {
        setLoading(false);
      }
    };

    // Асинхронная функция для инициализации ленты
    const initFeed = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Успешно получили координаты
            fetchFeed(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.warn("Ошибка геолокации:", error.message);
            setGeoError("Разрешите доступ к геолокации, чтобы видеть ближайшие книги, или выберите город в профиле.");
            // Фолбэк без координат
            fetchFeed();
          },
          { timeout: 10000, maximumAge: 60000 }
        );
      } else {
        // Браузер не поддерживает геолокацию
        setGeoError("Ваш браузер не поддерживает геолокацию. Показаны последние добавленные книги.");
        fetchFeed();
      }
    };

    initFeed();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <header className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Обмен книгами
          </h1>
          <p className="text-gray-500">
            Найдите интересные книги рядом с вами
          </p>
        </header>

        {/* Баннер ошибки геопозиции */}
        {geoError && !loading && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
            <MapPinOff className="shrink-0 mt-0.5" size={20} />
            <p className="text-sm">{geoError}</p>
          </div>
        )}

        {/* Сетка книг */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {loading ? (
            // Показываем 10 скелетонов во время загрузки
            Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : books.length > 0 ? (
            books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              Пока нет доступных книг для обмена.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
