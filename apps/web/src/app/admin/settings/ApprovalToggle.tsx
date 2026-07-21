"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setRequiresApprovalAction } from "@/lib/actions/settings";

export function ApprovalToggle({ initialValue }: { initialValue: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function toggle() {
    const next = !value;
    setPending(true);
    setError(undefined);
    const result = await setRequiresApprovalAction(next);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setValue(next);
    router.refresh();
  }

  return (
    <div className="border-tropical-teal bg-space-indigo flex flex-col gap-2 rounded border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-neon-ice font-medium">קביעה/ביטול תור דורשים אישור שלי</p>
          <p className="text-sm text-gray-300">
            {value
              ? "דלוק — כל קביעת תור ובקשת ביטול ממתינות לאישור שלך."
              : "כבוי — לקוחות קובעים ומבטלים תורים לבד, בלי שתצטרך לאשר."}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={pending}
          role="switch"
          aria-checked={value}
          className={`h-7 w-12 shrink-0 rounded-full border p-1 transition-colors disabled:opacity-50 ${
            value ? "bg-tropical-teal border-tropical-teal" : "bg-prussian-blue border-gray-500"
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition-transform ${
              value ? "translate-x-[-20px]" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
