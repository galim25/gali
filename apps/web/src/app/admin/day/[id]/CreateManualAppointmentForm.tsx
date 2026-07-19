"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { getServices, getSlotsForDate, type ServiceOption } from "@/lib/actions/booking";
import { createManualAppointmentAction } from "@/lib/actions/adminAppointments";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

export function CreateManualAppointmentForm({ workDayId }: { workDayId: string }) {
  const router = useRouter();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getServices().then(setServices);
  }, []);

  const service = services.find((s) => s.id === serviceId);

  useEffect(() => {
    setSlots([]);
    setStartsAt("");
    if (!serviceId) return;
    getSlotsForDate(workDayId, serviceId).then(setSlots);
  }, [serviceId, workDayId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !startsAt) {
      setError("יש לבחור שירות ושעה");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await createManualAppointmentAction({
      work_day_id: workDayId,
      service_id: serviceId,
      starts_at: startsAt,
      customer_name: customerName,
      attendee_name: service?.is_child_service ? attendeeName : undefined,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setServiceId("");
    setStartsAt("");
    setCustomerName("");
    setAttendeeName("");
    router.refresh();
  }

  const inputClass = "border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2";

  return (
    <form onSubmit={submit} className="border-tropical-teal flex flex-col gap-3 rounded border p-4">
      <h2 className="text-neon-ice font-medium">קביעת תור ידנית (לקוח ללא חשבון)</h2>

      <label className="flex flex-col gap-1 text-sm text-gray-300">
        שירות
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputClass} required>
          <option value="" disabled>
            בחרו שירות
          </option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration_minutes} דק&apos;)
            </option>
          ))}
        </select>
      </label>

      {serviceId && (
        <label className="flex flex-col gap-1 text-sm text-gray-300">
          שעה
          <select value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} required>
            <option value="" disabled>
              {slots.length === 0 ? "אין שעות פנויות ביום זה" : "בחרו שעה"}
            </option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {formatTime(s)}
              </option>
            ))}
          </select>
        </label>
      )}

      <input
        placeholder="שם הלקוח"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className={inputClass}
        required
      />

      {service?.is_child_service && (
        <input
          placeholder="שם הילד/ה"
          value={attendeeName}
          onChange={(e) => setAttendeeName(e.target.value)}
          className={inputClass}
          required
        />
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium disabled:opacity-50"
      >
        {pending ? "שומר..." : "קביעת תור"}
      </button>
    </form>
  );
}
