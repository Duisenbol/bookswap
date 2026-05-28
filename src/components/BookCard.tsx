import React from "react";
import { Star, MapPin } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Утилита для объединения классов Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type BookTier = "BRONZE" | "SILVER" | "GOLD";

export interface FeedBook {
  id: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  tier: BookTier;
  conditionRating: number | null;
  distance?: number; // в километрах
}

const TIER_COLORS = {
  BRONZE: "bg-amber-700/10 text-amber-800 border-amber-700/20",
  SILVER: "bg-slate-400/10 text-slate-600 border-slate-400/20",
  GOLD: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
};

const TIER_LABELS = {
  BRONZE: "Бронза",
  SILVER: "Серебро",
  GOLD: "Золото",
};

// Форматирование дистанции
const formatDistance = (distKm?: number) => {
  if (distKm === undefined || distKm === null) return null;
  if (distKm < 1) {
    // Меньше 1 км -> показываем метры
    const meters = Math.round(distKm * 1000);
    return `${meters} м от вас`;
  }
  // Больше 1 км -> показываем километры с 1 знаком после запятой
  return `${distKm.toFixed(1)} км от вас`;
};

export function BookCard({ book }: { book: FeedBook }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md">
      {/* Обложка */}
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {book.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="text-gray-400 text-sm">Нет обложки</div>
        )}

        {/* Бейдж грейда */}
        <div
          className={cn(
            "absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-semibold border backdrop-blur-md",
            TIER_COLORS[book.tier]
          )}
        >
          {TIER_LABELS[book.tier]}
        </div>
      </div>

      {/* Инфо */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-900 line-clamp-1" title={book.title}>
          {book.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
          {book.authors && book.authors.length > 0
            ? book.authors.join(", ")
            : "Неизвестный автор"}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between text-sm">
          {/* Состояние */}
          <div className="flex items-center text-gray-600 gap-1">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="font-medium">
              {book.conditionRating ? `${book.conditionRating}/10` : "—/10"}
            </span>
          </div>

          {/* Расстояние */}
          {book.distance !== undefined && (
            <div className="flex items-center text-gray-500 gap-1">
              <MapPin size={16} />
              <span className="text-xs truncate max-w-[100px]">
                {formatDistance(book.distance)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-4 flex flex-col flex-grow">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
