"use client";

import { useEffect, useState, useCallback } from "react";
import { BookCard, SkeletonCard, type FeedBook } from "@/components/BookCard";
import { MapPinOff, Plus } from "lucide-react";
import { AddBookFlow } from "@/components/AddBookFlow";

export default function Home() {
  const [books, setBooks] = useState<FeedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);

  // Функция загрузки ленты (мемоизирована)
  const fetchFeed = useCallback(async (lat?: number, lng?: number, city?: string) => {
    try {
      setLoading(true);
      let url = "/api/feed";
      const params = new URLSearchParams();
      if (lat !== undefined && lng !== undefined) {
        params.append("lat", lat.toString());
        params.append("lng", lng.toString());
      } else if (city) {
        params.append("city", city);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
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
  }, []);

  useEffect(() => {
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
  }, [fetchFeed]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    fetchFeed(undefined, undefined, city);
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto space-y-6">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Обмен книгами
            </h1>
            <p className="text-gray-500">
              Найдите интересные книги рядом с вами
            </p>
          </div>

          <button
            onClick={() => setIsAddBookModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={20} />
            Добавить книгу
          </button>
        </header>

        {/* Баннер ошибки геопозиции и выбор города */}
        {geoError && !loading && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <MapPinOff className="shrink-0 mt-0.5" size={20} />
              <p className="text-sm">{geoError}</p>
            </div>

            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="bg-white border border-amber-300 text-amber-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 outline-none min-w-[200px]"
            >
              <option value="">Выберите город...</option>
              <option value="Алматы">Алматы</option>
              <option value="Астана">Астана</option>
              <option value="Шымкент">Шымкент</option>
              <option value="Караганда">Караганда</option>
            </select>
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

      {isAddBookModalOpen && (
        <AddBookFlow onClose={() => setIsAddBookModalOpen(false)} />
      )}
    </main>
  );
}
