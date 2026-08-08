import { ISRAEL_TIME_ZONE, zonedTimeToUtc } from "@barberbook/shared";

export type Interval = { starts_at: Date; ends_at: Date };

export type AvailabilityInput = {
  work_day: Interval;
  busy: Interval[]; // breaks + blocked times + existing scheduled appointments
  duration_minutes: number;
  slot_step_minutes?: number;
};

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Pure slot-finding function — the single source of truth for "is this
 * appointment allowed". Both the booking UI and the create-appointment
 * transaction must go through this so a slot can never be offered and
 * then rejected (or worse, double-booked) for different reasons.
 *
 * The grid is anchored to work_day.starts_at in fixed slot_step_minutes
 * increments, but re-anchors to the end of any busy interval it hits —
 * a candidate that overlaps busy time jumps straight to that interval's
 * end (no gap) and resumes stepping from there. Without this, a busy
 * block whose duration isn't a multiple of the step (e.g. a 15-minute
 * service on a 10-minute grid) would leave the grid offset from then on,
 * surfacing two consecutive offered slots less than a step apart.
 */
export function findAvailableSlots(input: AvailabilityInput): Date[] {
  const step = (input.slot_step_minutes ?? 10) * 60_000;
  const durationMs = input.duration_minutes * 60_000;
  const dayStart = input.work_day.starts_at.getTime();
  const dayEnd = input.work_day.ends_at.getTime();

  const slots: Date[] = [];
  let start = dayStart;
  while (start + durationMs <= dayEnd) {
    const end = start + durationMs;
    const conflict = input.busy.find((b) =>
      overlaps(new Date(start), new Date(end), b.starts_at, b.ends_at),
    );
    if (conflict) {
      start = conflict.ends_at.getTime();
      continue;
    }
    slots.push(new Date(start));
    start += step;
  }
  return slots;
}

export type DayPeriod = {
  key: "morning" | "afternoon" | "evening";
  label: string;
  starts_at: Date;
  ends_at: Date;
};

const DAY_PERIOD_BOUNDARIES: { key: DayPeriod["key"]; label: string }[] = [
  { key: "morning", label: "בוקר" },
  { key: "afternoon", label: "צהריים" },
  { key: "evening", label: "ערב" },
];

/**
 * Nikud variants of the same labels above, for IVR TTS only (see
 * apps/web/src/lib/ivr/flow.ts) — the booking-UI's plain labels stay
 * un-vocalized since they're rendered as text, not spoken.
 */
export const DAY_PERIOD_LABELS_NIKUD: Record<DayPeriod["key"], string> = {
  morning: "בֹקֶר",
  afternoon: "צָהֳרַיִם",
  evening: "עֶרֶב",
};

/**
 * Splits a work day into up to 3 fixed time-of-day buckets (morning/
 * afternoon/evening) at 12:00/18:00 Israel wall-clock time, clipped to the
 * day's actual open hours. Clipping alone gives both "no gaps between
 * buckets" and "hide a bucket the day never reaches" (e.g. a 9:00-14:00 day
 * clips evening to start === end and drops it) without separate logic for
 * either. Boundaries are wall-clock, not the work day's UTC instant, so the
 * calendar date is read off `work_day.starts_at` in Israel time first.
 */
export function getDayPeriods(work_day: Interval): DayPeriod[] {
  const work_date = work_day.starts_at.toLocaleDateString("en-CA", { timeZone: ISRAEL_TIME_ZONE });
  const noon = zonedTimeToUtc(work_date, "12:00", ISRAEL_TIME_ZONE);
  const evening = zonedTimeToUtc(work_date, "18:00", ISRAEL_TIME_ZONE);

  const windows = [
    [work_day.starts_at, noon],
    [noon, evening],
    [evening, work_day.ends_at],
  ] as const;

  return DAY_PERIOD_BOUNDARIES.map(({ key, label }, i) => {
    const [start, end] = windows[i];
    const starts_at = start < work_day.starts_at ? work_day.starts_at : start;
    const ends_at = end > work_day.ends_at ? work_day.ends_at : end;
    return { key, label, starts_at, ends_at };
  }).filter((p) => p.starts_at < p.ends_at);
}

export function isSlotAvailable(
  candidateStart: Date,
  durationMinutes: number,
  workDay: Interval,
  busy: Interval[],
): boolean {
  const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60_000);
  if (candidateStart < workDay.starts_at || candidateEnd > workDay.ends_at) {
    return false;
  }
  return !busy.some((b) => overlaps(candidateStart, candidateEnd, b.starts_at, b.ends_at));
}
