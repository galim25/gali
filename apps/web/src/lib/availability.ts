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
