import Link from "next/link";
import { prisma } from "@barberbook/db";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { getSession } from "@/lib/auth/session";
import { RescheduleButton } from "./RescheduleButton";
import { RequestCancellationButton } from "./RequestCancellationButton";
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
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="התורים שלי" />
      <div className="flex justify-end">
        <Link href="/account/book" className="bg-tropical-teal text-prussian-blue rounded px-3 py-2 text-sm font-medium">
          תור חדש
        </Link>
      </div>

      {appointments.length === 0 && <p className="text-gray-400">אין לך תורים קרובים.</p>}

      <ul className="flex flex-col gap-3">
        {appointments.map((a) => (
          <li key={a.id} className="border-tropical-teal bg-space-indigo rounded border p-3">
            <p className="text-neon-ice font-medium">{a.service.name}</p>
            <p className="text-sm text-gray-300">{formatDateTime(a.starts_at)}</p>
            {a.attendee_type === "child" && (
              <p className="text-sm text-gray-400">עבור: {a.attendee_name}</p>
            )}
            {a.cancellation_request?.status === "pending" ? (
              <p className="mt-2 text-sm text-gray-400">בקשת ביטול נשלחה — ממתינה לאישור הספר</p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <RescheduleButton appointmentId={a.id} serviceId={a.service.id} />
                <RequestCancellationButton appointmentId={a.id} />
              </div>
            )}
          </li>
        ))}
      </ul>

      <Link href="/account" className="text-neon-ice text-sm underline">
        חזרה לאזור האישי
      </Link>
    </main>
  );
}
