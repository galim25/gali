export type IvrStep =
  | "register_name"
  | "register_confirm"
  | "barber"
  | "service"
  | "slot_offer"
  | "day_pick"
  | "time_pick"
  | "book_more";

export type DayOption = { work_day_id: string; work_date: string };
export type BarberOption = { id: string; full_name: string };
export type ServiceOption = { id: string; name: string; is_child_service: boolean };

export type CallState = {
  step: IvrStep;
  user_id?: string;
  customer_name?: string;
  /** Local-format (0XXXXXXXXX) number, set for a not-yet-registered caller. */
  phone_number?: string;
  pending_name?: string;
  name_attempts: number;
  /** Consecutive no-input/invalid-choice count, post-identification only (§7 general convention, updated 2026-08-04 — no more live transfer, see flow.ts's handleMenuFailure). Reset to 0 on any valid choice; a 2nd consecutive failure hangs up. */
  invalid_attempts: number;
  barber_id?: string;
  barber_options?: BarberOption[];
  service_id?: string;
  is_child_service?: boolean;
  service_options?: ServiceOption[];
  offered_work_day_id?: string;
  offered_starts_at?: string;
  day_options?: DayOption[];
  time_options?: string[];
};

/**
 * Same in-memory-Map precedent as rateLimit.ts (apps/web/src/lib/rateLimit.ts)
 * — the architecture (CLAUDE.md) runs a single Next.js container, so a
 * process-local Map keyed by Yemot's ApiCallId is enough; it won't survive a
 * restart mid-call (continueCall's "state not found" branch in flow.ts hangs
 * up with an apology rather than crash) and won't coordinate across replicas
 * if this ever scales horizontally.
 */
const calls = new Map<string, CallState>();

const MAX_TRACKED_CALLS = 500;

export function getCallState(apiCallId: string): CallState | undefined {
  return calls.get(apiCallId);
}

export function setCallState(apiCallId: string, state: CallState): CallState {
  if (!calls.has(apiCallId) && calls.size >= MAX_TRACKED_CALLS) calls.clear();
  calls.set(apiCallId, state);
  return state;
}

export function clearCallState(apiCallId: string): void {
  calls.delete(apiCallId);
}
