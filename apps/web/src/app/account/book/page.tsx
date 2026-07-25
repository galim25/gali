"use client";

import { useEffect, useMemo, useState } from "react";
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
import { joinWaitlistAction } from "@/lib/actions/waitlist";
import { getRequiresApproval } from "@/lib/actions/settings";
import { BrandHero } from "@/components/BrandHero";
import { BsdBar } from "@/components/BsdBar";

type Step = "date" | "service" | "slot" | "attendee" | "done";

const WEEKDAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const MONTH_LABELS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

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

/** Real month grid, RTL (Sunday on the right) — only dates present in `openDates` are clickable. */
function DateCalendar({
  openDates,
  onChoose,
}: {
  openDates: OpenDate[];
  onChoose: (d: OpenDate) => void;
}) {
  const openByDate = useMemo(() => new Map(openDates.map((d) => [d.work_date, d])), [openDates]);
  const availableMonths = useMemo(() => {
    const months = new Set(openDates.map((d) => d.work_date.slice(0, 7)));
    return Array.from(months).sort();
  }, [openDates]);
  const [monthKey, setMonthKey] = useState(availableMonths[0] ?? new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(monthKey)) {
      setMonthKey(availableMonths[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableMonths.join(",")]);

  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const monthIndex = availableMonths.indexOf(monthKey);

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="border-barber-teal rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={monthIndex <= 0}
          onClick={() => setMonthKey(availableMonths[monthIndex - 1])}
          className="text-barber-teal disabled:opacity-20"
          aria-label="חודש קודם"
        >
          ‹
        </button>
        <p className="text-ink font-bold">
          {MONTH_LABELS[month - 1]} {year}
        </p>
        <button
          type="button"
          disabled={monthIndex === -1 || monthIndex >= availableMonths.length - 1}
          onClick={() => setMonthKey(availableMonths[monthIndex + 1])}
          className="text-barber-teal disabled:opacity-20"
          aria-label="חודש הבא"
        >
          ›
        </button>
      </div>
      <div dir="rtl" className="grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-slate-muted text-xs">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
          const open = openByDate.get(dateStr);
          return (
            <button
              type="button"
              key={i}
              disabled={!open}
              onClick={() => open && onChoose(open)}
              className={
                open
                  ? "bg-barber-teal text-cream-text mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                  : "text-ink/30 mx-auto flex h-8 w-8 items-center justify-center text-sm"
              }
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
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
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistPending, setWaitlistPending] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

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
    getRequiresApproval().then(setRequiresApproval);
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
    setPendingApproval(!!result.pendingApproval);
    setStep("done");
  }

  async function joinWaitlist() {
    setWaitlistPending(true);
    await joinWaitlistAction();
    setWaitlistPending(false);
    setWaitlistJoined(true);
  }

  function bookAnother() {
    setStep("date");
    setService(undefined);
    setDate(undefined);
    setSlot(undefined);
    setAttendeeName("");
    setPendingApproval(false);
  }

  return (
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-md flex-col p-6">
      <BsdBar />
      <BrandHero />
      <h1 className="text-barber-teal mt-6 mb-6 text-center text-3xl font-bold">קביעת תור</h1>

      {requiresApproval && step !== "done" && (
        <p className="text-slate-muted mb-4 text-sm">
          לתשומת ליבך: כרגע כל תור וכל בקשת ביטול דורשים אישור מפורש של הספר.
        </p>
      )}

      {step === "date" && (
        <div className="flex flex-col gap-3">
          <p className="text-ink font-bold">בחרו תאריך:</p>
          {datesLoading ? (
            <p className="text-slate-muted">טוען תאריכים...</p>
          ) : dates.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-slate-muted">אין כרגע ימים פתוחים להזמנה.</p>
              {waitlistJoined ? (
                <p className="text-barber-teal text-sm font-medium">
                  תקבל/י התראה ברגע שייפתחו תאריכים חדשים לקביעת תורים.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={joinWaitlist}
                  disabled={waitlistPending}
                  className="border-barber-teal text-barber-teal rounded-full border py-2 text-sm font-medium disabled:opacity-50"
                >
                  {waitlistPending ? "נרשם..." : "התרע/י לי כשייפתחו תאריכים לקביעת תורים"}
                </button>
              )}
            </div>
          ) : (
            <DateCalendar openDates={dates} onChoose={chooseDate} />
          )}
        </div>
      )}

      {step === "service" && (
        <div className="flex flex-col gap-2">
          <p className="text-ink font-bold">בחרו שירות:</p>
          {services.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => chooseService(s)}
              className="border-barber-teal text-ink hover:bg-barber-teal/10 rounded-xl border bg-white p-3 text-right"
            >
              {s.name} <span className="text-slate-muted text-sm">({s.duration_minutes} דק&apos;)</span>
            </button>
          ))}
          <button type="button" onClick={() => setStep("date")} className="text-barber-teal self-start text-sm font-medium">
            חזרה
          </button>
        </div>
      )}

      {step === "slot" && (
        <div className="flex flex-col gap-3">
          <p className="text-ink font-bold">בחרו שעה:</p>
          {slots.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-slate-muted">אין שעות פנויות ביום זה.</p>
              {waitlistJoined ? (
                <p className="text-barber-teal text-sm font-medium">
                  נרשמת לרשימת ההמתנה — נעדכן אותך כשיתפנה תור.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={joinWaitlist}
                  disabled={waitlistPending}
                  className="border-barber-teal text-barber-teal rounded-full border py-2 text-sm font-medium disabled:opacity-50"
                >
                  {waitlistPending ? "נרשם..." : "הצטרפ/י לרשימת ההמתנה"}
                </button>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                type="button"
                key={s}
                disabled={pending}
                onClick={() => chooseSlot(s)}
                className="border-barber-teal text-barber-teal hover:bg-barber-teal hover:text-cream-text rounded-full border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep("service")} className="text-barber-teal self-start text-sm font-medium">
            חזרה
          </button>
        </div>
      )}

      {step === "attendee" && (
        <div className="flex flex-col gap-4">
          <p className="text-slate-muted">
            {service?.name} · {date && formatDate(date.work_date)} · {slot && formatTime(slot)}
          </p>
          <label className="border-barber-teal focus-within:ring-barber-teal flex items-center gap-2 rounded-xl border bg-white px-4 py-3 focus-within:ring-2">
            <input
              placeholder="שם הילד/ה"
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
              className="text-ink placeholder-slate-muted w-full bg-transparent outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={() => confirm()}
            disabled={pending || !attendeeName.trim()}
            className="bg-barber-teal text-cream-text rounded-full py-3 text-center text-lg font-bold tracking-wide uppercase disabled:opacity-50"
          >
            {pending ? "שומר..." : "אישור קביעת תור"}
          </button>
          <button type="button" onClick={() => setStep("slot")} className="text-barber-teal self-start text-sm font-medium">
            חזרה
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-4">
          <p className="text-ink text-lg font-bold">
            {pendingApproval ? "הבקשה שלך נשלחה לאישור הספר." : "התור נקבע בהצלחה!"}
          </p>
          <button
            type="button"
            onClick={bookAnother}
            className="border-barber-teal text-barber-teal rounded-full border py-3 font-bold"
          >
            קביעת תור נוסף
          </button>
          <button
            type="button"
            onClick={() => router.push("/account/appointments")}
            className="bg-barber-teal text-cream-text rounded-full py-3 text-center font-bold"
          >
            לצפייה בתורים שלי
          </button>
        </div>
      )}

    </main>
  );
}
