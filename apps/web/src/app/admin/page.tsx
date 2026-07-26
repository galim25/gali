import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { getWorkDaysAdmin } from "@/lib/actions/workdays";
import { getPendingCancellationCount } from "@/lib/actions/cancellationRequests";
import { getUnreadAdminNotificationCount } from "@/lib/actions/adminNotifications";
import { getPendingBookingRequestCount } from "@/lib/actions/bookingRequests";
import { OpenWorkDayForm } from "./OpenWorkDayForm";
import { DeleteAllWorkDaysButton } from "./DeleteAllWorkDaysButton";
import { BlockDayToggle } from "./day/[id]/BlockDayToggle";
import { PageHeader } from "@/components/PageHeader";
import { AdminBrandHero } from "@/components/AdminBrandHero";

function formatWorkDate(d: Date) {
  return d.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

function formatHour(d: Date) {
  return d.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

export default async function AdminPage() {
  const session = await requireAdmin();
  const workDays = await getWorkDaysAdmin();
  const pendingCancellations = await getPendingCancellationCount();
  const unreadNotifications = await getUnreadAdminNotificationCount();
  const pendingBookingRequests = await getPendingBookingRequestCount();

  return (
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title={`היי ${session.full_name}`} topBanner={<AdminBrandHero />} />
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/admin/booking-requests"
          className="border-barber-teal text-barber-teal rounded-full border px-3 py-1 text-sm font-medium"
        >
          בקשות תורים{pendingBookingRequests > 0 && ` (${pendingBookingRequests})`}
        </Link>
        <Link
          href="/admin/cancellation-requests"
          className="border-barber-teal text-barber-teal rounded-full border px-3 py-1 text-sm font-medium"
        >
          בקשות ביטול{pendingCancellations > 0 && ` (${pendingCancellations})`}
        </Link>
        <Link
          href="/admin/notifications"
          className="border-barber-teal text-barber-teal rounded-full border px-3 py-1 text-sm font-medium"
        >
          התראות{unreadNotifications > 0 && ` (${unreadNotifications})`}
        </Link>
        <Link
          href="/admin/blocked-customers"
          className="border-barber-teal text-barber-teal rounded-full border px-3 py-1 text-sm font-medium"
        >
          לקוחות חסומים
        </Link>
        <Link
          href="/admin/waitlist"
          className="border-barber-teal text-barber-teal rounded-full border px-3 py-1 text-sm font-medium"
        >
          רשימת המתנה
        </Link>
        <Link
          href="/admin/announcements"
          className="border-barber-teal text-barber-teal rounded-full border px-3 py-1 text-sm font-medium"
        >
          הודעות כלליות
        </Link>
        <Link
          href="/admin/settings"
          className="border-barber-teal text-barber-teal rounded-full border px-3 py-1 text-sm font-medium"
        >
          הגדרות
        </Link>
      </div>

      <OpenWorkDayForm openWorkDates={workDays.map((d) => d.work_date.toISOString().slice(0, 10))} />

      <div className="flex flex-col gap-2">
        <h2 className="text-ink font-bold">ימי עבודה פתוחים</h2>
        {workDays.length === 0 && <p className="text-slate-muted">אין ימי עבודה פתוחים כרגע.</p>}
        <ul className="flex flex-col gap-2">
          {workDays.map((d) => (
            <li key={d.id} className="border-barber-teal bg-white rounded-xl border p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-ink font-bold">
                  {formatWorkDate(d.work_date)}
                  {d.is_blocked && (
                    <span className="bg-barber-teal text-cream-text mr-2 rounded-full px-2 py-0.5 text-xs font-medium">
                      חסום
                    </span>
                  )}
                </p>
                <div className="flex flex-col items-end gap-1">
                  <Link href={`/admin/day/${d.id}`} className="text-barber-teal text-sm underline">
                    ניהול היום
                  </Link>
                  <BlockDayToggle workDayId={d.id} initialValue={d.is_blocked} compact />
                </div>
              </div>
              <p className="text-slate-muted">
                {formatHour(d.starts_at)}–{formatHour(d.ends_at)}
              </p>
              {d.breaks.length > 0 && (
                <p className="text-slate-muted">
                  הפסקות:{" "}
                  {d.breaks
                    .map((b) => `${formatHour(b.starts_at)}–${formatHour(b.ends_at)}`)
                    .join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-barber-teal bg-white flex flex-col gap-2 rounded-xl border p-4">
        <h2 className="text-ink font-bold">היסטוריה וגיבוי</h2>
        <Link href="/admin/print-all" className="text-barber-teal text-sm underline">
          הדפסה / שמירת עותק כ-PDF של כל היומן
        </Link>
        <DeleteAllWorkDaysButton />
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="border-barber-teal text-barber-teal rounded-full border px-4 py-2 font-medium"
        >
          התנתקות
        </button>
      </form>

    </main>
  );
}
