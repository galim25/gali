import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";

export default async function AccountPage() {
  const session = await getSession();

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">שלום, {session?.full_name}</h1>
      <div className="flex flex-col gap-2">
        <Link href="/account/book" className="rounded bg-black p-3 text-center text-white">
          קביעת תור
        </Link>
        <Link href="/account/appointments" className="rounded border border-black p-3 text-center">
          התורים שלי
        </Link>
      </div>
      <form action={logoutAction}>
        <button type="submit" className="rounded border border-black px-4 py-2">
          התנתקות
        </button>
      </form>
    </main>
  );
}
