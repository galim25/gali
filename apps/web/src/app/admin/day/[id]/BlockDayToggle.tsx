"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setWorkDayBlockedAction } from "@/lib/actions/workdays";

/**
 * Blocks/unblocks this specific day from new customer self-service bookings
 * (US ask, 2026-07-26) — separate from deleting the day (irreversible, wipes
 * everything) and from BlockedTime (blocks one hour range, not the whole
 * day). Existing appointments are untouched either way; the admin's own
 * manual appointment creation still works while blocked.
 */
export function BlockDayToggle({
  workDayId,
  initialValue,
  compact = false,
}: {
  workDayId: string;
  initialValue: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function toggle() {
    const next = !value;
    setPending(true);
    setError(undefined);
    const result = await setWorkDayBlockedAction(workDayId, next);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setValue(next);
    router.refresh();
  }

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-muted text-xs">חסימת יום</span>
          <button
            onClick={toggle}
            disabled={pending}
            role="switch"
            aria-checked={value}
            aria-label="חסימת יום מקביעת תורים חדשים"
            className={`h-5 w-9 shrink-0 rounded-full border p-0.5 transition-colors disabled:opacity-50 ${
              value ? "bg-barber-teal border-barber-teal" : "bg-white border-barber-teal"
            }`}
          >
            <span
              className={`block h-3.5 w-3.5 rounded-full transition-transform ${
                value ? "bg-white translate-x-[-16px]" : "bg-slate-muted translate-x-0"
              }`}
            />
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="border-barber-teal bg-white flex flex-col gap-2 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-ink font-bold">חסימת היום מקביעת תורים חדשים</p>
          <p className="text-sm text-slate-muted">
            {value
              ? "חסום — לקוחות לא יכולים לקבוע או לשנות תור אליו ליום הזה. התורים הקיימים לא נפגעים."
              : "פתוח — לקוחות יכולים לקבוע תורים ליום הזה כרגיל."}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={pending}
          role="switch"
          aria-checked={value}
          className={`h-7 w-12 shrink-0 rounded-full border p-1 transition-colors disabled:opacity-50 ${
            value ? "bg-barber-teal border-barber-teal" : "bg-white border-barber-teal"
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full transition-transform ${
              value ? "bg-white translate-x-[-20px]" : "bg-slate-muted translate-x-0"
            }`}
          />
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
