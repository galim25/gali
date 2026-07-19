"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ISRAEL_TIME_ZONE } from "@barberbook/shared";
import {
  getServices,
  getOpenDates,
  getSlotsForDate,
  bookAppointmentAction,
  type ServiceOption,
  type OpenDate,
} from "@/lib/actions/booking";

type Step = "service" | "date" | "slot" | "attendee" | "done";

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

export default function BookAppointmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [dates, setDates] = useState<OpenDate[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const [service, setService] = useState<ServiceOption>();
  const [date, setDate] = useState<OpenDate>();
  const [slot, setSlot] = useState<string>();
  const [attendeeName, setAttendeeName] = useState("");

  useEffect(() => {
    getServices().then(setServices);
  }, []);

  async function chooseService(s: ServiceOption) {
    setService(s);
    setError(undefined);
    const openDates = await getOpenDates();
    setDates(openDates);
    setStep("date");
  }

  async function chooseDate(d: OpenDate) {
    if (!service) return;
    setDate(d);
    setError(undefined);
    const available = await getSlotsForDate(d.work_day_id, service.id);
    setSlots(available);
    setStep("slot");
  }

  async function chooseSlot(s: string) {
    setSlot(s);
    setError(undefined);
    if (service?.is_child_service) {
      setStep("attendee");
      return;
    }
    await confirm(s);
  }

  async function confirm(slotOverride?: string) {
    const starts_at = slotOverride ?? slot;
    if (!service || !date || !starts_at) return;
    setPending(true);
    setError(undefined);
    const result = await bookAppointmentAction({
      work_day_id: date.work_day_id,
      service_id: service.id,
      starts_at,
      attendee_name: service.is_child_service ? attendeeName : undefined,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      // The slot might have just been taken by someone else — refresh the list.
      const available = await getSlotsForDate(date.work_day_id, service.id);
      setSlots(available);
      setStep("slot");
      return;
    }
    setStep("done");
  }

  function bookAnother() {
    setStep("service");
    setService(undefined);
    setDate(undefined);
    setSlot(undefined);
    setAttendeeName("");
  }

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">קביעת תור</h1>

      {step === "service" && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-600">בחרו שירות:</p>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => chooseService(s)}
              className="rounded border border-gray-300 p-3 text-right hover:bg-gray-50"
            >
              {s.name} <span className="text-sm text-gray-500">({s.duration_minutes} דק&apos;)</span>
            </button>
          ))}
        </div>
      )}

      {step === "date" && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-600">בחרו תאריך:</p>
          {dates.length === 0 && <p className="text-gray-500">אין כרגע ימים פתוחים להזמנה.</p>}
          {dates.map((d) => (
            <button
              key={d.work_day_id}
              onClick={() => chooseDate(d)}
              className="rounded border border-gray-300 p-3 text-right hover:bg-gray-50"
            >
              {formatDate(d.work_date)}
            </button>
          ))}
          <button onClick={() => setStep("service")} className="text-sm text-gray-500 underline">
            חזרה
          </button>
        </div>
      )}

      {step === "slot" && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-600">בחרו שעה:</p>
          {slots.length === 0 && <p className="text-gray-500">אין שעות פנויות ביום זה.</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-4 gap-2">
            {slots.map((s) => (
              <button
                key={s}
                disabled={pending}
                onClick={() => chooseSlot(s)}
                className="rounded border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
          <button onClick={() => setStep("date")} className="text-sm text-gray-500 underline">
            חזרה
          </button>
        </div>
      )}

      {step === "attendee" && (
        <div className="flex flex-col gap-3">
          <p className="text-gray-600">
            {service?.name} · {date && formatDate(date.work_date)} · {slot && formatTime(slot)}
          </p>
          <input
            placeholder="שם הילד/ה"
            value={attendeeName}
            onChange={(e) => setAttendeeName(e.target.value)}
            className="rounded border border-gray-300 p-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={() => confirm()}
            disabled={pending || !attendeeName.trim()}
            className="rounded bg-black p-2 text-white disabled:opacity-50"
          >
            {pending ? "שומר..." : "אישור קביעת תור"}
          </button>
          <button onClick={() => setStep("slot")} className="text-sm text-gray-500 underline">
            חזרה
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-3">
          <p className="text-lg">התור נקבע בהצלחה!</p>
          <button onClick={bookAnother} className="rounded border border-black p-2">
            קביעת תור נוסף
          </button>
          <button onClick={() => router.push("/account/appointments")} className="rounded bg-black p-2 text-white">
            לצפייה בתורים שלי
          </button>
        </div>
      )}
    </main>
  );
}
