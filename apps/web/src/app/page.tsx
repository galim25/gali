import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/PageHeader";

export default async function HomePage() {
  const session = await getSession();

  return (
    <main
      dir="rtl"
      className="bg-prussian-blue mx-auto flex min-h-screen max-w-sm flex-col items-center gap-4 p-6 text-center"
    >
      <PageHeader />
      <p className="text-gray-300">מערכת ניהול תורים למספרה</p>
      {session ? (
        <Link
          href={session.role === "administrator" ? "/admin" : "/account"}
          className="bg-tropical-teal text-prussian-blue rounded px-4 py-2 font-medium"
        >
          {session.role === "administrator" ? "לניהול היומן" : "לאזור האישי"}
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link href="/login" className="bg-tropical-teal text-prussian-blue rounded px-4 py-2 font-medium">
            התחברות
          </Link>
          <Link href="/register" className="border-tropical-teal text-neon-ice rounded border px-4 py-2">
            הרשמה
          </Link>
        </div>
      )}
    </main>
  );
}
