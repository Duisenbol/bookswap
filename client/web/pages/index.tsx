import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl mb-4">Войти в BookSwap</h1>
        <button onClick={() => signIn("google")} className="px-4 py-2 bg-blue-500 text-white rounded">
          Войти через Google
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Привет, {session.user?.name}!</h1>
      <p>У тебя {session.user?.credits ?? 1} кредит(ов)</p>
      <button onClick={() => signOut()} className="px-4 py-2 bg-gray-600 text-white rounded mt-4">
        Выйти
      </button>
    </main>
  );
}