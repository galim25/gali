import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { getAnnouncements } from "@/lib/actions/announcements";

function formatDate(d: Date) {
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", timeZone: ISRAEL_TIME_ZONE });
}

export default async function AccountPage() {
  const session = await getSession();
  const announcements = await getAnnouncements();

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

      {announcements.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-medium">הודעות מהספר</h2>
          <ul className="flex flex-col gap-2">
            {announcements.map((a) => (
              <li key={a.id} className="rounded border border-gray-200 p-3 text-sm">
                <p className="font-medium">{a.title}</p>
                <p className="whitespace-pre-wrap text-gray-600">{a.content}</p>
                <p className="text-gray-400">{formatDate(a.published_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={logoutAction}>
        <button type="submit" className="rounded border border-black px-4 py-2">
          התנתקות
        </button>
      </form>
    </main>
  );
}
