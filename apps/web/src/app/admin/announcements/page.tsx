import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/actions/announcements";
import { AnnouncementForm } from "./AnnouncementForm";

function formatDateTime(d: Date) {
  return d.toLocaleString("he-IL", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

export default async function AnnouncementsPage() {
  await requireAdmin();
  const announcements = await getAnnouncements();

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">הודעות כלליות</h1>
        <Link href="/admin" className="text-sm text-gray-500 underline">
          חזרה לניהול
        </Link>
      </div>

      <AnnouncementForm />

      <div className="flex flex-col gap-2">
        {announcements.length === 0 && <p className="text-gray-500">אין הודעות שפורסמו.</p>}
        <ul className="flex flex-col gap-2">
          {announcements.map((a) => (
            <li key={a.id} className="rounded border border-gray-200 p-3 text-sm">
              <p className="font-medium">{a.title}</p>
              <p className="whitespace-pre-wrap text-gray-600">{a.content}</p>
              <p className="text-gray-400">{formatDateTime(a.published_at)}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
