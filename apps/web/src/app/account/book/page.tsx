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
import { PageHeader } from "@/components/PageHeader";

type Step = "date" | "service" | "slot" | "attendee" | "done";

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
  const [step, setStep] = useState<Step>("date");
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [dates, setDates] = useState<OpenDate[]>([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const [service, setService] = useState<ServiceOption>();
  const [date, setDate] = useState<OpenDate>();
  const [slot, setSlot] = useState<string>();
  const [attendeeName, setAttendeeName] = useState("");

  // Dates come first: the customer sees whether there's anything open at
  // all before picking a service, instead of choosing a service and only
  // then discovering there are no open dates. datesLoading avoids a false
  // "no open dates" flash while the fetch is still in flight.
  useEffect(() => {
    getOpenDates()
      .then(setDates)
      .finally(() => setDatesLoading(false));
  }, []);

  async function chooseDate(d: OpenDate) {
    setDate(d);
    setError(undefined);
    const available = await getServices();
    setServices(available);
    setStep("service");
  }

  async function chooseService(s: ServiceOption) {
    if (!date) return;
    setService(s);
    setError(undefined);
    const available = await getSlotsForDate(date.work_day_id, s.id);
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
    setStep("date");
    setService(undefined);
    setDate(undefined);
    setSlot(undefined);
    setAttendeeName("");
  }

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <PageHeader title="קביעת תור" />

      {step === "date" && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-300">בחרו תאריך:</p>
          {datesLoading ? (
            <p className="text-gray-400">טוען תאריכים...</p>
          ) : (
            dates.length === 0 && <p className="text-gray-400">אין כרגע ימים פתוחים להזמנה.</p>
          )}
          {dates.map((d) => (
            <button
              key={d.work_day_id}
              onClick={() => chooseDate(d)}
              className="border-tropical-teal bg-space-indigo text-neon-ice hover:bg-dusk-blue rounded border p-3 text-right"
            >
              {formatDate(d.work_date)}
            </button>
          ))}
        </div>
      )}

      {step === "service" && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-300">בחרו שירות:</p>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => chooseService(s)}
              className="border-tropical-teal bg-space-indigo text-neon-ice hover:bg-dusk-blue rounded border p-3 text-right"
            >
              {s.name} <span className="text-sm text-gray-400">({s.duration_minutes} דק&apos;)</span>
            </button>
          ))}
          <button onClick={() => setStep("date")} className="text-neon-ice text-sm underline">
            חזרה
          </button>
        </div>
      )}

      {step === "slot" && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-300">בחרו שעה:</p>
          {slots.length === 0 && <p className="text-gray-400">אין שעות פנויות ביום זה.</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="grid grid-cols-4 gap-2">
            {slots.map((s) => (
              <button
                key={s}
                disabled={pending}
                onClick={() => chooseSlot(s)}
                className="border-tropical-teal bg-space-indigo text-neon-ice hover:bg-dusk-blue rounded border p-2 disabled:opacity-50"
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
          <button onClick={() => setStep("service")} className="text-neon-ice text-sm underline">
            חזרה
          </button>
        </div>
      )}

      {step === "attendee" && (
        <div className="flex flex-col gap-3">
          <p className="text-gray-300">
            {service?.name} · {date && formatDate(date.work_date)} · {slot && formatTime(slot)}
          </p>
          <input
            placeholder="שם הילד/ה"
            value={attendeeName}
            onChange={(e) => setAttendeeName(e.target.value)}
            className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={() => confirm()}
            disabled={pending || !attendeeName.trim()}
            className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium disabled:opacity-50"
          >
            {pending ? "שומר..." : "אישור קביעת תור"}
          </button>
          <button onClick={() => setStep("slot")} className="text-neon-ice text-sm underline">
            חזרה
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-3">
          <p className="text-neon-ice text-lg">התור נקבע בהצלחה!</p>
          <button onClick={bookAnother} className="border-tropical-teal text-neon-ice rounded border p-2">
            קביעת תור נוסף
          </button>
          <button
            onClick={() => router.push("/account/appointments")}
            className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium"
          >
            לצפייה בתורים שלי
          </button>
        </div>
      )}
    </main>
  );
}
