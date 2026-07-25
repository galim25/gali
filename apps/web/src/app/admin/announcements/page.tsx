import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/actions/announcements";
import { AnnouncementForm } from "./AnnouncementForm";
import { AnnouncementItem } from "./AnnouncementItem";
import { PageHeader } from "@/components/PageHeader";
import { AdminBrandHero } from "@/components/AdminBrandHero";

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
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="הודעות כלליות" topBanner={<AdminBrandHero />} />
      <div className="flex justify-end">
        <Link href="/admin" className="text-barber-teal text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      <AnnouncementForm />

      <div className="flex flex-col gap-2">
        {announcements.length === 0 && <p className="text-slate-muted">אין הודעות שפורסמו.</p>}
        <ul className="flex flex-col gap-2">
          {announcements.map((a) => (
            <AnnouncementItem key={a.id} announcement={a} publishedAt={formatDateTime(a.published_at)} />
          ))}
        </ul>
      </div>

    </main>
  );
}
