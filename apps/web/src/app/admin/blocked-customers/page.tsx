import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getBlockedPhoneNumbers } from "@/lib/actions/blocklist";
import { BlockPhoneNumberForm } from "./BlockPhoneNumberForm";
import { UnblockButton } from "./UnblockButton";
import { PageHeader } from "@/components/PageHeader";

function formatDate(d: Date) {
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric", timeZone: ISRAEL_TIME_ZONE });
}

export default async function BlockedCustomersPage() {
  await requireAdmin();
  const blocked = await getBlockedPhoneNumbers();

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="לקוחות חסומים" />
      <div className="flex justify-end">
        <Link href="/admin" className="text-neon-ice text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      <BlockPhoneNumberForm />

      <div className="flex flex-col gap-2">
        {blocked.length === 0 && <p className="text-gray-400">אין מספרים חסומים כרגע.</p>}
        <ul className="flex flex-col gap-2">
          {blocked.map((b) => (
            <li key={b.id} className="border-tropical-teal bg-space-indigo rounded border p-3 text-sm">
              <p className="text-neon-ice font-medium">{b.phone_number}</p>
              {b.reason && <p className="text-gray-300">{b.reason}</p>}
              <p className="text-gray-400">נחסם ב-{formatDate(b.created_at)}</p>
              <div className="mt-1">
                <UnblockButton id={b.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
