"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteWorkDayAction } from "@/lib/actions/workdays";

export function DeleteWorkDayButton({ workDayId }: { workDayId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function del(notifyCustomers: boolean) {
    const warning = notifyCustomers
      ? "למחוק את כל היום הזה לצמיתות? כל התורים יימחקו ולא ניתן יהיה לשחזר אותם. לקוחות עם תור פעיל יקבלו הודעת ביטול."
      : "למחוק את כל היום הזה לצמיתות? כל התורים יימחקו ולא ניתן יהיה לשחזר אותם. לקוחות לא יקבלו שום הודעה על כך.";
    if (!window.confirm(warning)) return;
    setPending(true);
    setError(undefined);
    const result = await deleteWorkDayAction(workDayId, notifyCustomers);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-red-400 px-3 py-2 text-sm text-red-400"
      >
        מחיקת היום כולו
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-red-400 p-3">
      <p className="text-sm text-red-400">
        מומלץ לשמור קודם{" "}
        <Link href={`/admin/day/${workDayId}/print`} target="_blank" className="underline">
          עותק להדפסה/PDF
        </Link>{" "}
        לפני המחיקה — היא בלתי הפיכה.
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => del(true)}
          disabled={pending}
          className="rounded border border-red-400 px-3 py-2 text-sm text-red-400 disabled:opacity-50"
        >
          {pending ? "מוחק..." : "מחיקה + שליחת הודעת ביטול ללקוחות"}
        </button>
        <button
          onClick={() => del(false)}
          disabled={pending}
          className="rounded border border-red-400 px-3 py-2 text-sm text-red-400 disabled:opacity-50"
        >
          {pending ? "מוחק..." : "מחיקה בלי לשלוח הודעה ללקוחות"}
        </button>
        <button onClick={() => setOpen(false)} disabled={pending} className="text-neon-ice text-sm underline">
          ביטול
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
