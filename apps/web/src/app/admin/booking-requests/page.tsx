import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getPendingBookingRequests } from "@/lib/actions/bookingRequests";
import { DecideBookingRequestButtons } from "./DecideBookingRequestButtons";
import { PageHeader } from "@/components/PageHeader";

function formatDateTime(d: Date) {
  return d.toLocaleString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

export default async function BookingRequestsPage() {
  await requireAdmin();
  const requests = await getPendingBookingRequests();

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="בקשות תורים" />
      <div className="flex justify-end">
        <Link href="/admin" className="text-neon-ice text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      {requests.length === 0 && <p className="text-gray-400">אין בקשות תור ממתינות.</p>}

      <ul className="flex flex-col gap-3">
        {requests.map((r) => (
          <li key={r.id} className="border-tropical-teal bg-space-indigo rounded border p-3 text-sm">
            <p className="text-neon-ice font-medium">
              {r.customer_name} · {r.service_name}
            </p>
            <p className="text-gray-300">{formatDateTime(r.starts_at)}</p>
            <p className="text-gray-400">הבקשה נשלחה: {formatDateTime(r.requested_at)}</p>
            <div className="mt-2">
              <DecideBookingRequestButtons requestId={r.id} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
