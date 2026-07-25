import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { BrandHero } from "@/components/BrandHero";
import { BsdBar } from "@/components/BsdBar";

export default async function HomePage() {
  const session = await getSession();

  return (
    <main
      dir="rtl"
      className="bg-cream mx-auto flex min-h-screen max-w-sm flex-col items-center p-6 text-center"
    >
      <BsdBar />
      <BrandHero />
      <h1 className="text-barber-teal mt-16 text-3xl font-bold">BarberBook</h1>
      <p className="text-slate-muted mt-2">מערכת ניהול תורים למספרה</p>
      {session ? (
        <Link
          href={session.role === "administrator" ? "/admin" : "/account"}
          className="bg-barber-teal text-cream-text mt-8 rounded-full px-6 py-3 font-bold"
        >
          {session.role === "administrator" ? "לניהול היומן" : "לאזור האישי"}
        </Link>
      ) : (
        <div className="mt-8 flex gap-3">
          <Link href="/login" className="bg-barber-teal text-cream-text rounded-full px-6 py-3 font-bold">
            התחברות
          </Link>
          <Link href="/register" className="border-barber-teal text-barber-teal rounded-full border px-6 py-3 font-bold">
            הרשמה
          </Link>
        </div>
      )}
    </main>
  );
}
