import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold">BarberBook</h1>
      <p className="text-gray-600">מערכת ניהול תורים למספרה</p>
      {session ? (
        <Link
          href={session.role === "administrator" ? "/admin" : "/account"}
          className="rounded bg-black px-4 py-2 text-white"
        >
          {session.role === "administrator" ? "לניהול היומן" : "לאזור האישי"}
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
            התחברות
          </Link>
          <Link href="/register" className="rounded border border-black px-4 py-2">
            הרשמה
          </Link>
        </div>
      )}
    </main>
  );
}
