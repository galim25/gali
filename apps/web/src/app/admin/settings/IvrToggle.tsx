"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setIvrEnabledAction } from "@/lib/actions/settings";

export function IvrToggle({ initialValue }: { initialValue: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function toggle() {
    const next = !value;
    setPending(true);
    setError(undefined);
    const result = await setIvrEnabledAction(next);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setValue(next);
    router.refresh();
  }

  return (
    <div className="border-barber-teal bg-white flex flex-col gap-2 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-ink font-bold">קביעת תור טלפונית (IVR)</p>
          <p className="text-sm text-slate-muted">
            {value
              ? "פעיל — לקוחות יכולים לקבוע תור בשיחת טלפון."
              : "כבוי — מתקשרים שומעים הודעה שלא ניתן לקבוע תור כרגע, ומנותקים."}
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
