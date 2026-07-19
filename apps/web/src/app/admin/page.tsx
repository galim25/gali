import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { getWorkDaysAdmin } from "@/lib/actions/workdays";
import { getPendingCancellationCount } from "@/lib/actions/cancellationRequests";
import { OpenWorkDayForm } from "./OpenWorkDayForm";
import { DeleteAllWorkDaysButton } from "./DeleteAllWorkDaysButton";

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

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול — {session.full_name}</h1>
        <div className="flex flex-col items-end gap-1">
          <Link href="/admin/cancellation-requests" className="text-sm text-gray-500 underline">
            בקשות ביטול{pendingCancellations > 0 && ` (${pendingCancellations})`}
          </Link>
          <Link href="/admin/blocked-customers" className="text-sm text-gray-500 underline">
            לקוחות חסומים
          </Link>
        </div>
      </div>

      <OpenWorkDayForm />

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">ימי עבודה פתוחים</h2>
        {workDays.length === 0 && <p className="text-gray-500">אין ימי עבודה פתוחים כרגע.</p>}
        <ul className="flex flex-col gap-2">
          {workDays.map((d) => (
            <li key={d.id} className="rounded border border-gray-200 p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{formatWorkDate(d.work_date)}</p>
                <Link href={`/admin/day/${d.id}`} className="text-sm underline">
                  ניהול היום
                </Link>
              </div>
              <p className="text-gray-600">
                {formatHour(d.starts_at)}–{formatHour(d.ends_at)}
              </p>
              {d.breaks.length > 0 && (
                <p className="text-gray-500">
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

      <div className="flex flex-col gap-2 rounded border border-gray-200 p-4">
        <h2 className="font-medium">היסטוריה וגיבוי</h2>
        <Link href="/admin/print-all" className="text-sm underline">
          הדפסה / שמירת עותק כ-PDF של כל היומן
        </Link>
        <DeleteAllWorkDaysButton />
      </div>

      <form action={logoutAction}>
        <button type="submit" className="rounded border border-black px-4 py-2">
          התנתקות
        </button>
      </form>
    </main>
  );
}
