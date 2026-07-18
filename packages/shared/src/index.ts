// Fixed service catalog from docs/# PRD BarberBook.txt (US-005).
// Single source of truth — do not invent other services or durations elsewhere.
export const SERVICE_DEFINITIONS = [
  { name: "תספורת מבוגר", duration_minutes: 10 },
  { name: "תספורת + זקן", duration_minutes: 15 },
  { name: "תספורת ילד", duration_minutes: 10 },
  { name: "הסרת שיער בלייזר", duration_minutes: 10 },
  { name: "חלאקה", duration_minutes: 15 },
] as const;

export const PHONE_NUMBER_REGEX = /^0\d{8,9}$/;

export const PASSWORD_RESET_CODE_TTL_MINUTES = 10;
export const APPOINTMENT_REMINDER_LEAD_MINUTES = 120;

export * from "./sms";
