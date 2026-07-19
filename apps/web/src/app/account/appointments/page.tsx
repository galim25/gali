import Link from "next/link";
import { prisma } from "@barberbook/db";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { getSession } from "@/lib/auth/session";
import { RescheduleButton } from "./RescheduleButton";
import { RequestCancellationButton } from "./RequestCancellationButton";

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

export default async function AppointmentsPage() {
  const session = await getSession();
  if (!session) return null;

  const appointments = await prisma.appointment.findMany({
    where: {
      booked_by_user_id: session.sub,
      status: "scheduled",
      starts_at: { gte: new Date() },
    },
    include: { service: true, cancellation_request: true },
    orderBy: { starts_at: "asc" },
  });

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">התורים שלי</h1>
        <Link href="/account/book" className="rounded bg-black px-3 py-2 text-sm text-white">
          תור חדש
        </Link>
      </div>

      {appointments.length === 0 && <p className="text-gray-500">אין לך תורים קרובים.</p>}

      <ul className="flex flex-col gap-3">
        {appointments.map((a) => (
          <li key={a.id} className="rounded border border-gray-200 p-3">
            <p className="font-medium">{a.service.name}</p>
            <p className="text-sm text-gray-600">{formatDateTime(a.starts_at)}</p>
            {a.attendee_type === "child" && (
              <p className="text-sm text-gray-500">עבור: {a.attendee_name}</p>
            )}
            {a.cancellation_request?.status === "pending" ? (
              <p className="mt-2 text-sm text-gray-500">בקשת ביטול נשלחה — ממתינה לאישור הספר</p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <RescheduleButton appointmentId={a.id} serviceId={a.service.id} />
                <RequestCancellationButton appointmentId={a.id} />
              </div>
            )}
          </li>
        ))}
      </ul>

      <Link href="/account" className="text-sm text-gray-500 underline">
        חזרה לאזור האישי
      </Link>
    </main>
  );
}
