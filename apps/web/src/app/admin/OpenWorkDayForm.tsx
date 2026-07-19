"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkDayAction } from "@/lib/actions/workdays";

type BreakRow = { starts_at: string; ends_at: string };

export function OpenWorkDayForm() {
  const router = useRouter();
  const [workDate, setWorkDate] = useState("");
  const [startsAt, setStartsAt] = useState("09:00");
  const [endsAt, setEndsAt] = useState("18:00");
  const [breaks, setBreaks] = useState<BreakRow[]>([]);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  function addBreak() {
    setBreaks((b) => [...b, { starts_at: "13:00", ends_at: "14:00" }]);
  }

  function updateBreak(index: number, field: keyof BreakRow, value: string) {
    setBreaks((b) => b.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeBreak(index: number) {
    setBreaks((b) => b.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!workDate) {
      setError("יש לבחור תאריך");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await createWorkDayAction({
      work_date: workDate,
      starts_at: startsAt,
      ends_at: endsAt,
      breaks,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setWorkDate("");
    setBreaks([]);
    router.refresh();
  }

  const inputClass = "border-tropical-teal bg-space-indigo text-neon-ice rounded border p-2";

  return (
    <form onSubmit={submit} className="border-tropical-teal flex flex-col gap-3 rounded border p-4">
      <h2 className="text-neon-ice font-medium">פתיחת יום עבודה חדש</h2>

      <label className="flex flex-col gap-1 text-sm text-gray-300">
        תאריך
        <input
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          className={inputClass}
          required
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm text-gray-300">
          שעת התחלה
          <input
            type="time"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm text-gray-300">
          שעת סיום
          <input
            type="time"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={inputClass}
            required
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-300">הפסקות</p>
        {breaks.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="time"
              value={b.starts_at}
              onChange={(e) => updateBreak(i, "starts_at", e.target.value)}
              className={inputClass}
            />
            <span className="text-gray-400">—</span>
            <input
              type="time"
              value={b.ends_at}
              onChange={(e) => updateBreak(i, "ends_at", e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeBreak(i)}
              className="text-sm text-red-400 underline"
            >
              הסרה
            </button>
          </div>
        ))}
        <button type="button" onClick={addBreak} className="text-neon-ice w-fit text-sm underline">
          + הוספת הפסקה
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium disabled:opacity-50"
      >
        {pending ? "פותח יום..." : "פתיחת יום עבודה"}
      </button>
    </form>
  );
}
