import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getWaitlistEntries } from "@/lib/actions/waitlist";
import { RemoveWaitlistEntryButton } from "./RemoveWaitlistEntryButton";
import { PageHeader } from "@/components/PageHeader";

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
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="רשימת המתנה" />
      <div className="flex justify-end">
        <Link href="/admin" className="text-neon-ice text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {entries.length === 0 && <p className="text-gray-400">אין כרגע לקוחות ברשימת ההמתנה.</p>}
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.id} className="border-tropical-teal bg-space-indigo rounded border p-3 text-sm">
              <p className="text-neon-ice font-medium">{e.customer_name}</p>
              <p className="text-gray-300">{e.phone_number}</p>
              <p className="text-gray-400">נרשם/ה ב-{formatDate(e.created_at)}</p>
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
