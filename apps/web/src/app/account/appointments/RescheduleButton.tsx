"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import {
  getOpenDates,
  getSlotsForDate,
  rescheduleAppointmentAction,
  type OpenDate,
} from "@/lib/actions/booking";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ISRAEL_TIME_ZONE,
  });
}
function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

export function RescheduleButton({
  appointmentId,
  serviceId,
}: {
  appointmentId: string;
  serviceId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState<OpenDate[]>([]);
  const [date, setDate] = useState<OpenDate>();
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function start() {
    setOpen(true);
    setDate(undefined);
    setSlots([]);
    setError(undefined);
    setDates(await getOpenDates());
  }

  async function chooseDate(d: OpenDate) {
    setDate(d);
    setSlots(await getSlotsForDate(d.work_day_id, serviceId, appointmentId));
  }

  async function chooseSlot(starts_at: string) {
    if (!date) return;
    setPending(true);
    const result = await rescheduleAppointmentAction({
      appointment_id: appointmentId,
      work_day_id: date.work_day_id,
      starts_at,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={start} className="text-barber-teal text-sm font-medium">
        שינוי תור
      </button>
    );
  }

  return (
    <div className="border-barber-teal mt-2 flex flex-col gap-2 rounded-xl border bg-white p-3">
      {!date && (
        <>
          <p className="text-ink text-sm font-bold">בחרו תאריך חדש:</p>
          {dates.map((d) => (
            <button
              key={d.work_day_id}
              onClick={() => chooseDate(d)}
              className="border-barber-teal text-ink rounded-xl border p-2 text-right text-sm"
            >
              {formatDate(d.work_date)}
            </button>
          ))}
        </>
      )}
      {date && (
        <>
          <p className="text-ink text-sm font-bold">בחרו שעה חדשה:</p>
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s}
                disabled={pending}
                onClick={() => chooseSlot(s)}
                className="border-barber-teal text-barber-teal rounded-full border px-3 py-2 text-sm font-medium"
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
          {slots.length === 0 && <p className="text-slate-muted text-sm">אין שעות פנויות ביום זה.</p>}
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={() => setOpen(false)} className="text-slate-muted text-sm">
        ביטול
      </button>
    </div>
  );
}
