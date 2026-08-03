"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setBarberActiveAction } from "@/lib/actions/barbers";

/** Same compact switch pattern as BlockDayToggle (admin/day/[id]/BlockDayToggle.tsx). */
export function BarberActiveToggle({
  barberId,
  initialValue,
  isPrimary,
}: {
  barberId: string;
  initialValue: boolean;
  isPrimary: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  if (isPrimary) {
    return <span className="text-slate-muted text-xs">תמיד פעיל</span>;
  }

  async function toggle() {
    const next = !value;
    setPending(true);
    setError(undefined);
    const result = await setBarberActiveAction(barberId, next);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setValue(next);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-slate-muted text-xs">{value ? "פעיל" : "לא פעיל"}</span>
        <button
          onClick={toggle}
          disabled={pending}
          role="switch"
          aria-checked={value}
          aria-label="הפעלה/השבתה של הספר"
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
