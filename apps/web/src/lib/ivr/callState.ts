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
  no_input_attempts: number;
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
 * process-local Map keyed by Twilio's CallSid is enough; it won't survive a
 * restart mid-call (continueCall's "state not found" branch in flow.ts
 * hands off to the barber live rather than crash) and won't coordinate
 * across replicas if this ever scales horizontally.
 */
const calls = new Map<string, CallState>();

const MAX_TRACKED_CALLS = 500;

export function getCallState(callSid: string): CallState | undefined {
  return calls.get(callSid);
}

export function setCallState(callSid: string, state: CallState): CallState {
  if (!calls.has(callSid) && calls.size >= MAX_TRACKED_CALLS) calls.clear();
  calls.set(callSid, state);
  return state;
}

export function clearCallState(callSid: string): void {
  calls.delete(callSid);
}
