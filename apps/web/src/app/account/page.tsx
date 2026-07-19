import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { getAnnouncements } from "@/lib/actions/announcements";
import { PageHeader } from "@/components/PageHeader";

function formatDate(d: Date) {
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", timeZone: ISRAEL_TIME_ZONE });
}

export default async function AccountPage() {
  const session = await getSession();
  const announcements = await getAnnouncements();

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title={`היי ${session?.full_name}`} />

      <div className="flex flex-col gap-2">
        <Link
          href="/account/book"
          className="bg-tropical-teal text-prussian-blue rounded p-3 text-center font-medium"
        >
          קביעת תור
        </Link>
        <Link
          href="/account/appointments"
          className="border-tropical-teal text-neon-ice rounded border p-3 text-center font-medium"
        >
          התורים שלי
        </Link>
      </div>

      {announcements.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-neon-ice font-medium">הודעות מהספר</h2>
          <ul className="flex flex-col gap-2">
            {announcements.map((a) => (
              <li key={a.id} className="border-tropical-teal bg-space-indigo rounded border p-3 text-sm">
                <p className="text-neon-ice font-medium">{a.title}</p>
                <p className="whitespace-pre-wrap text-gray-300">{a.content}</p>
                <p className="text-dusk-blue">{formatDate(a.published_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={logoutAction}>
        <button type="submit" className="text-neon-ice rounded border border-gray-500 px-4 py-2">
          התנתקות
        </button>
      </form>
    </main>
  );
}
