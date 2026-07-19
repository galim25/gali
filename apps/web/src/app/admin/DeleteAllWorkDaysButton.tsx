"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAllWorkDaysAction } from "@/lib/actions/workdays";

export function DeleteAllWorkDaysButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function del() {
    if (
      !window.confirm(
        "למחוק את כל היומן לצמיתות — כל ימי העבודה וכל התורים, בלי יוצא מן הכלל? לא ניתן לשחזר. לקוחות עם תור פעיל יקבלו הודעת ביטול.",
      )
    ) {
      return;
    }
    if (!window.confirm("אישור נוסף: פעולה זו בלתי הפיכה. להמשיך?")) return;
    setPending(true);
    setError(undefined);
    const result = await deleteAllWorkDaysAction();
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={del}
        disabled={pending}
        className="rounded border border-red-600 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
      >
        {pending ? "מוחק..." : "מחיקת כל היומן"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
