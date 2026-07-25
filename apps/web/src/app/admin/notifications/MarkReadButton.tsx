"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAdminNotificationsReadAction } from "@/lib/actions/adminNotifications";

export function MarkReadButton({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!hasUnread) return null;

  async function markRead() {
    setPending(true);
    await markAdminNotificationsReadAction();
    setPending(false);
    router.refresh();
  }

  return (
    <button
      onClick={markRead}
      disabled={pending}
      className="text-barber-teal self-start text-sm underline disabled:opacity-50"
    >
      {pending ? "מסמן..." : "סמן הכל כנקרא"}
    </button>
  );
}
