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
import { BlockDayToggle } from "./BlockDayToggle";
import { PageHeader } from "@/components/PageHeader";
import { AdminBrandHero } from "@/components/AdminBrandHero";

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
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title={formatWorkDate(workDay.work_date)} topBanner={<AdminBrandHero />} />
      <div className="flex items-center justify-between">
        <p className="text-slate-muted text-sm">{workDay.barber.full_name}</p>
        <Link href="/admin" className="text-barber-teal text-sm underline">
          חזרה לניהול
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/admin/day/${workDay.id}/print`} className="text-barber-teal text-sm underline">
          הדפסה / שמירה כ-PDF
        </Link>
        <DeleteWorkDayButton workDayId={workDay.id} />
      </div>

      <BlockDayToggle workDayId={workDay.id} initialValue={workDay.is_blocked} />

      <EditHoursForm
        workDayId={workDay.id}
        initialStartsAt={formatHHMM(workDay.starts_at)}
        initialEndsAt={formatHHMM(workDay.ends_at)}
      />

      <CreateManualAppointmentForm workDayId={workDay.id} barberId={workDay.barber_id} />

      <div className="flex flex-col gap-2">
        <h2 className="text-ink font-bold">לוח היום ({appointments.length} תורים)</h2>
        <ul className="flex flex-col gap-1">
          {timeline.map((s, i) => {
            if (s.kind === "free") {
              return (
                <li key={i} className="rounded-xl p-2 text-sm text-slate-muted">
                  {formatHHMM(s.starts_at)}–{formatHHMM(s.ends_at)} · פנוי
                </li>
              );
            }
            if (s.kind === "break" || s.kind === "blocked") {
              return (
                <li
                  key={i}
                  className="border-barber-teal/40 bg-white rounded-xl border border-dashed p-2 text-sm text-slate-muted"
                >
                  {formatHHMM(s.starts_at)}–{formatHHMM(s.ends_at)} ·{" "}
                  {s.kind === "break" ? "הפסקה" : "חסום"}
                </li>
              );
            }
            return (
              <li key={s.id} className="border-barber-teal bg-white rounded-xl border p-3 text-sm">
                <p className="text-ink font-bold">
                  {formatHHMM(s.starts_at)}–{formatHHMM(s.ends_at)} · {s.service_name}
                </p>
                <p className="text-slate-muted">
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
