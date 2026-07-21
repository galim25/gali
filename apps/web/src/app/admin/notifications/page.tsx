import Link from "next/link";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminNotifications } from "@/lib/actions/adminNotifications";
import { MarkReadButton } from "./MarkReadButton";
import { PageHeader } from "@/components/PageHeader";

function formatDateTime(d: Date) {
  return d.toLocaleString("he-IL", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const notifications = await getAdminNotifications();
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="התראות" />
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-neon-ice text-sm underline">
          חזרה לניהול
        </Link>
        <MarkReadButton hasUnread={hasUnread} />
      </div>

      <div className="flex flex-col gap-2">
        {notifications.length === 0 && <p className="text-gray-400">אין התראות.</p>}
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`bg-space-indigo rounded border p-3 text-sm ${
                n.read_at ? "border-tropical-teal" : "border-neon-ice"
              }`}
            >
              <p className="text-neon-ice">{n.content}</p>
              <p className="text-gray-400">{formatDateTime(n.created_at)}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
