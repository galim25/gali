"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkDayAction } from "@/lib/actions/workdays";

export function DeleteWorkDayButton({ workDayId }: { workDayId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function del() {
    if (
      !window.confirm(
        "למחוק את כל היום הזה לצמיתות? כל התורים יימחקו ולא ניתן יהיה לשחזר אותם. לקוחות עם תור פעיל יקבלו הודעת ביטול.",
      )
    ) {
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await deleteWorkDayAction(workDayId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={del}
        disabled={pending}
        className="rounded border border-red-600 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
      >
        {pending ? "מוחק..." : "מחיקת היום כולו"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
