"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { Camera, Upload, X } from "lucide-react";

interface GoogleBooksData {
  title: string;
  authors: string[];
  description?: string;
  thumbnail?: string;
  googleBooksId?: string;
}

interface IsbnScannerProps {
  onScanSuccess: (data: GoogleBooksData) => void;
}

export default function IsbnScanner({ onScanSuccess }: IsbnScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Функция для запроса данных из Google Books API по ISBN
  const fetchBookByIsbn = React.useCallback(async (isbn: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const volumeInfo = data.items[0].volumeInfo;
        const bookData: GoogleBooksData = {
          title: volumeInfo.title || "Неизвестное название",
          authors: volumeInfo.authors || [],
          description: volumeInfo.description,
          thumbnail: volumeInfo.imageLinks?.thumbnail,
          googleBooksId: data.items[0].id
        };
        onScanSuccess(bookData);
        setIsScanning(false);
      } else {
        setError("Книга с таким ISBN не найдена в базе Google Books.");
      }
    } catch (err) {
      console.error("Ошибка при запросе к Google Books API:", err);
      setError("Произошла ошибка при поиске книги.");
    } finally {
      setIsLoading(false);
    }
  }, [onScanSuccess]);

  // Инициализация сканера камеры при открытии модалки
  useEffect(() => {
    let html5QrcodeScanner: Html5QrcodeScanner | null = null;

    if (isScanning) {
      html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          videoConstraints: { facingMode: "environment" }
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          // Успешное сканирование
          html5QrcodeScanner?.clear();
          fetchBookByIsbn(decodedText);
        },
        () => {
          // Игнорируем постоянные ошибки распознавания во время стрима камеры
        }
      );
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(console.error);
      }
    };
  }, [isScanning, fetchBookByIsbn]);

  // Обработчик загрузки изображения штрихкода из файла
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");
      // Сканируем загруженный файл
      const decodedText = await html5QrCode.scanFile(file, true);
      await fetchBookByIsbn(decodedText);
    } catch (err) {
      console.error("Ошибка сканирования файла:", err);
      setError("Не удалось распознать штрихкод на изображении. Попробуйте фото лучшего качества.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          <Camera size={20} />
          Сканировать камерой
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
        >
          <Upload size={20} />
          Загрузить скриншот
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {isLoading && <p className="text-blue-500 text-sm mt-2">Поиск книги...</p>}

      {/* Скрытый div нужен для Html5Qrcode (парсинг файлов) если сканер камеры закрыт */}
      <div id="reader-hidden" style={{ display: "none" }}></div>

      {/* Модальное окно сканера камеры */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-md relative">
            <button
              onClick={() => setIsScanning(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <X size={24} />
            </button>
            <h3 className="text-lg font-semibold mb-4">Наведите камеру на штрихкод ISBN</h3>
            <div id="reader" className="w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
