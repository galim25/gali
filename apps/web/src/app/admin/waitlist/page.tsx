import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getWaitlistEntries } from "@/lib/actions/waitlist";
import { RemoveWaitlistEntryButton } from "./RemoveWaitlistEntryButton";
import { PageHeader } from "@/components/PageHeader";
import { AdminBrandHero } from "@/components/AdminBrandHero";

function formatDate(d: Date) {
  return d.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

export default async function WaitlistPage() {
  await requireAdmin();
  const entries = await getWaitlistEntries();

  return (
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="רשימת המתנה" topBanner={<AdminBrandHero />} />
      <div className="flex justify-end">
        <Link href="/admin" className="text-barber-teal text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {entries.length === 0 && <p className="text-slate-muted">אין כרגע לקוחות ברשימת ההמתנה.</p>}
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.id} className="border-barber-teal bg-white rounded-xl border p-3 text-sm">
              <p className="text-ink font-bold">{e.customer_name}</p>
              <p className="text-slate-muted">{e.phone_number}</p>
              <p className="text-slate-muted">נרשם/ה ב-{formatDate(e.created_at)}</p>
              <div className="mt-1">
                <RemoveWaitlistEntryButton id={e.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>

    </main>
  );
}
