import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getPendingCancellationRequests } from "@/lib/actions/cancellationRequests";
import { DecideRequestButtons } from "./DecideRequestButtons";

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

export default async function CancellationRequestsPage() {
  await requireAdmin();
  const requests = await getPendingCancellationRequests();

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">בקשות ביטול</h1>
        <Link href="/admin" className="text-sm text-gray-500 underline">
          חזרה לניהול
        </Link>
      </div>

      {requests.length === 0 && <p className="text-gray-500">אין בקשות ביטול ממתינות.</p>}

      <ul className="flex flex-col gap-3">
        {requests.map((r) => (
          <li key={r.id} className="rounded border border-gray-200 p-3 text-sm">
            <p className="font-medium">
              {r.customer_name} · {r.service_name}
            </p>
            <p className="text-gray-600">{formatDateTime(r.starts_at)}</p>
            <p className="text-gray-400">בקשה נשלחה: {formatDateTime(r.requested_at)}</p>
            <div className="mt-2">
              <DecideRequestButtons requestId={r.id} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
