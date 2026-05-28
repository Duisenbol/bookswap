"use client";

import React, { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import IsbnScanner from "./IsbnScanner";
import { X, Check } from "lucide-react";

interface GoogleBooksData {
  title: string;
  authors: string[];
  description?: string;
  thumbnail?: string;
  googleBooksId?: string;
}

interface AddBookFlowProps {
  onClose: () => void;
}

export function AddBookFlow({ onClose }: AddBookFlowProps) {
  const { status } = useSession();
  const [bookData, setBookData] = useState<GoogleBooksData | null>(null);
  const [conditionRating, setConditionRating] = useState<number>(5);
  const [conditionComment, setConditionComment] = useState("");
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация данных при монтировании компонента для Сценария Б
  React.useEffect(() => {
    if (status === "authenticated" && !bookData) {
      const pendingData = localStorage.getItem("pendingBookData");
      if (pendingData) {
        try {
          const parsed = JSON.parse(pendingData);
          setTimeout(() => setBookData(parsed), 0);
        } catch (e) {
          console.error("Ошибка парсинга pendingBookData", e);
        }
      }
    }
  }, [status, bookData]);

  const handleScanSuccess = (data: GoogleBooksData) => {
    setBookData(data);

    // Сценарий А: Пользователь не авторизован
    if (status === "unauthenticated") {
      // Сохраняем данные сканирования для последующего восстановления
      localStorage.setItem("pendingBookData", JSON.stringify(data));
    }
  };

  const handleLogin = (provider: string) => {
    // Редирект на логин, а после - в личную библиотеку для продолжения
    signIn(provider, { callbackUrl: "/library?claimBook=true" });
  };

  const handlePublish = async () => {
    if (!bookData) return;
    setError(null);
    setLoadingGeo(true);

    if (!("geolocation" in navigator)) {
      setError("Геолокация не поддерживается вашим браузером");
      setLoadingGeo(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLoadingGeo(false);
        setPublishing(true);

        try {
          // Для простоты в этом демо запрашиваем город "Unknown" (в реальном приложении можно добавить Reverse Geocoding)
          const city = "Ваш город";

          const payload = {
            title: bookData.title,
            authors: bookData.authors,
            description: bookData.description || null,
            thumbnail: bookData.thumbnail || null,
            googleBooksId: bookData.googleBooksId || null,
            conditionRating,
            conditionComment: conditionComment || null,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city, // Заглушка, можно запросить у пользователя или через гео-сервис
          };

          const res = await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          if (data.success) {
            onClose(); // Закрываем форму при успехе
          } else {
            setError(data.error || "Ошибка публикации книги");
          }
        } catch (err: unknown) {
          console.error(err);
          setError("Произошла сетевая ошибка");
        } finally {
          setPublishing(false);
        }
      },
      (geoError) => {
        console.warn(geoError);
        setLoadingGeo(false);
        setError("Пожалуйста, разрешите доступ к геолокации для публикации книги.");
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-6 overflow-y-auto">
          {!bookData ? (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Добавить книгу</h2>
              <p className="text-gray-600 mb-6">
                Отсканируйте штрихкод (ISBN) на обратной стороне книги, чтобы мы автоматически заполнили данные.
              </p>
              <IsbnScanner onScanSuccess={handleScanSuccess} />
            </div>
          ) : status === "unauthenticated" ? (
            // Сценарий А: Пользователь не авторизован
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Книга найдена!</h2>
              <p className="text-gray-600 mb-6">
                «{bookData.title}»
              </p>
              <p className="text-gray-600 mb-8">
                Чтобы сохранить её в свою библиотеку и выставить на обмен, пожалуйста, войдите в систему.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleLogin("google")}
                  className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Войти через Google
                </button>
                <button
                  onClick={() => handleLogin("apple")}
                  className="w-full bg-black text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
                >
                  Войти через Apple ID
                </button>
              </div>
            </div>
          ) : (
            // Сценарий Б: Пользователь авторизован (форма сохранения)
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Публикация книги</h2>

              <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                {bookData.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bookData.thumbnail} alt={bookData.title} className="w-16 h-24 object-cover rounded shadow-sm" />
                ) : (
                  <div className="w-16 h-24 bg-gray-200 rounded shadow-sm flex items-center justify-center text-xs text-gray-400">Нет фото</div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-2">{bookData.title}</h3>
                  <p className="text-sm text-gray-500">{bookData.authors?.join(", ")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Оценка состояния (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={conditionRating}
                    onChange={(e) => setConditionRating(parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="text-center text-sm font-semibold text-blue-600">{conditionRating} / 10</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий к состоянию (необязательно)</label>
                  <textarea
                    value={conditionComment}
                    onChange={(e) => setConditionComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Например: Потерта обложка, есть пометки карандашом..."
                    rows={3}
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  onClick={handlePublish}
                  disabled={publishing || loadingGeo}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
                >
                  {loadingGeo ? "Определение геопозиции..." : publishing ? "Сохранение..." : "Сохранить и опубликовать"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
