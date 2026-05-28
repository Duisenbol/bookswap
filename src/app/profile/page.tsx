"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center">Загрузка профиля...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

        <header className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <UserIcon size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session?.user?.name || "Пользователь"}</h1>
              <p className="text-gray-500">{session?.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition"
          >
            <LogOut size={20} />
            Выйти
          </button>
        </header>

        <section className="pt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Кошелек токенов</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
              <div className="text-amber-800 text-sm font-medium mb-1">Бронзовые</div>
              <div className="text-2xl font-bold text-amber-900">{session?.user?.bronzeTokens || 0}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
              <div className="text-slate-600 text-sm font-medium mb-1">Серебряные</div>
              <div className="text-2xl font-bold text-slate-700">{session?.user?.silverTokens || 0}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center">
              <div className="text-yellow-700 text-sm font-medium mb-1">Золотые</div>
              <div className="text-2xl font-bold text-yellow-800">{session?.user?.goldTokens || 0}</div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
