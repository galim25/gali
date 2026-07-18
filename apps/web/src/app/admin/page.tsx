import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";

export default async function AdminPage() {
  const session = await getSession();

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">ניהול — {session?.full_name}</h1>
      <p className="text-gray-600">ניהול היומן יתווסף בשלב 3.</p>
      <form action={logoutAction}>
        <button type="submit" className="rounded border border-black px-4 py-2">
          התנתקות
        </button>
      </form>
    </main>
  );
}
