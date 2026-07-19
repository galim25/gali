import Link from "next/link";
import { notFound } from "next/navigation";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getWorkDayDetail } from "@/lib/actions/workdays";
import { getAppointmentsForWorkDay } from "@/lib/actions/adminAppointments";
import { buildDayTimeline } from "@/lib/dayTimeline";
import { EditHoursForm } from "./EditHoursForm";
import { MoveAppointmentButton } from "./MoveAppointmentButton";
import { CancelAppointmentButton } from "./CancelAppointmentButton";
import { CreateManualAppointmentForm } from "./CreateManualAppointmentForm";
import { DeleteWorkDayButton } from "./DeleteWorkDayButton";

function formatHHMM(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ISRAEL_TIME_ZONE,
    hour12: false,
  });
}

function formatWorkDate(d: Date) {
  return d.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

export default async function AdminDayPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const workDay = await getWorkDayDetail(id);
  if (!workDay) notFound();

  const appointments = await getAppointmentsForWorkDay(id);
  const timeline = buildDayTimeline(
    workDay.starts_at,
    workDay.ends_at,
    workDay.breaks,
    workDay.blocked_times,
    appointments,
  );

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{formatWorkDate(workDay.work_date)}</h1>
        <Link href="/admin" className="text-sm text-gray-500 underline">
          חזרה לניהול
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/admin/day/${workDay.id}/print`} className="text-sm underline">
          הדפסה / שמירה כ-PDF
        </Link>
        <DeleteWorkDayButton workDayId={workDay.id} />
      </div>

      <EditHoursForm
        workDayId={workDay.id}
        initialStartsAt={formatHHMM(workDay.starts_at)}
        initialEndsAt={formatHHMM(workDay.ends_at)}
      />

      <CreateManualAppointmentForm workDayId={workDay.id} />

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">לוח היום ({appointments.length} תורים)</h2>
        <ul className="flex flex-col gap-1">
          {timeline.map((s, i) => {
            if (s.kind === "free") {
              return (
                <li key={i} className="rounded p-2 text-sm text-gray-400">
                  {formatHHMM(s.starts_at)}–{formatHHMM(s.ends_at)} · פנוי
                </li>
              );
            }
            if (s.kind === "break" || s.kind === "blocked") {
              return (
                <li key={i} className="rounded bg-gray-100 p-2 text-sm text-gray-500">
                  {formatHHMM(s.starts_at)}–{formatHHMM(s.ends_at)} ·{" "}
                  {s.kind === "break" ? "הפסקה" : "חסום"}
                </li>
              );
            }
            return (
              <li key={s.id} className="rounded border border-blue-300 bg-blue-100 p-3 text-sm">
                <p className="font-medium">
                  {formatHHMM(s.starts_at)}–{formatHHMM(s.ends_at)} · {s.service_name}
                </p>
                <p className="text-gray-700">
                  {s.customer_name}
                  {s.attendee_type === "child" && ` (עבור: ${s.attendee_name})`}
                  {!s.has_account && " · תור ידני"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <MoveAppointmentButton
                    appointmentId={s.id}
                    workDayId={workDay.id}
                    serviceId={s.service_id}
                  />
                  <CancelAppointmentButton appointmentId={s.id} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
