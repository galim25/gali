import { NextResponse } from "next/server";
import { prisma } from "@barberbook/db";
import { formatIsraelTime, ISRAEL_TIME_ZONE } from "@barberbook/shared";
import { getActiveBarbers } from "@/lib/actions/barbers";
import { getServices, getOpenDates, getSlotsForDate, getEarliestAvailability } from "@/lib/actions/booking";
import { registerUserCore } from "@/lib/actions/registerCore";
import { identifyCaller, generateRandomPassword } from "@/lib/ivr/identifyCaller";
import { bookViaPhone } from "@/lib/ivr/bookViaPhone";
import { sayAndGatherDigits, sayAndGatherSpeech, sayAndHangup, transferToBarber } from "@/lib/ivr/twiml";
import { getCallState, setCallState, clearCallState, type CallState } from "@/lib/ivr/callState";

const MAX_MENU_OPTIONS = 9;
const MAX_NAME_ATTEMPTS = 2;

function weekdayDate(d: Date): string {
  return d.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: ISRAEL_TIME_ZONE,
  });
}

/** §7 step 1 — the very first webhook of an incoming call. */
export async function startCall(callSid: string, from: string | null): Promise<NextResponse> {
  const identity = await identifyCaller(from);

  if (identity.outcome === "no_caller_id") {
    return sayAndHangup("לא ניתן לזהות את מספרך. השתמשו באפליקציה או בקו הרגיל של המספרה.");
  }
  if (identity.outcome === "blocked") {
    return sayAndHangup("לא ניתן לקבוע תור בקו זה. אנא צרו קשר עם המספרה.");
  }

  if (identity.outcome === "existing_user") {
    const state: CallState = {
      step: "barber",
      user_id: identity.user_id,
      customer_name: identity.full_name,
      name_attempts: 0,
      no_input_attempts: 0,
    };
    setCallState(callSid, state);
    return renderBarberStep(callSid, state, `שלום ${identity.full_name}, בואו נקבע לך תור. `);
  }

  // new_caller
  setCallState(callSid, {
    step: "register_name",
    phone_number: identity.phone_number,
    name_attempts: 0,
    no_input_attempts: 0,
  });
  return sayAndGatherSpeech("שלום, זו הפעם הראשונה שאת/ה מתקשר/ת בקו הזה. מה שמך המלא?");
}

/** Every subsequent webhook of the same call (the `action` of every `<Gather>` — §5). */
export async function continueCall(
  callSid: string,
  digits: string,
  speechResult: string,
): Promise<NextResponse> {
  const state = getCallState(callSid);
  if (!state) {
    // Lost state (process restart mid-call, or a stray/duplicate request) —
    // no context to recover, hand off live rather than loop forever.
    return transferToBarber("מצטערים, אירעה תקלה. מעביר/ה אותך לספר.");
  }

  const hasInput = digits.trim() !== "" || speechResult.trim() !== "";
  if (!hasInput) {
    // General no-input convention (§7 preamble): repeat once, then transfer.
    state.no_input_attempts += 1;
    if (state.no_input_attempts > 1) {
      clearCallState(callSid);
      return transferToBarber();
    }
    setCallState(callSid, state);
    return renderStep(callSid, state, "לא התקבל קלט. ");
  }
  state.no_input_attempts = 0;

  switch (state.step) {
    case "register_name":
      return handleRegisterName(callSid, state, speechResult);
    case "register_confirm":
      return handleRegisterConfirm(callSid, state, digits);
    case "barber":
      return handleBarberChoice(callSid, state, digits);
    case "service":
      return handleServiceChoice(callSid, state, digits);
    case "slot_offer":
      return handleSlotOffer(callSid, state, digits);
    case "day_pick":
      return handleDayPick(callSid, state, digits);
    case "time_pick":
      return handleTimePick(callSid, state, digits);
    case "book_more":
      return handleBookMore(callSid, state, digits);
    default:
      return transferToBarber();
  }
}

/** Re-renders the prompt for the current step (used to repeat after a no-input timeout). */
async function renderStep(callSid: string, state: CallState, prefix = ""): Promise<NextResponse> {
  switch (state.step) {
    case "register_name":
      return sayAndGatherSpeech(prefix + "מה שמך המלא?");
    case "register_confirm":
      return sayAndGatherDigits(prefix + `שמעתי ${state.pending_name}, נכון? הקש 1 לאישור, 2 לניסיון נוסף.`);
    case "barber":
      return renderBarberStep(callSid, state, prefix);
    case "service":
      return renderServiceStep(callSid, state, prefix);
    case "slot_offer":
      return renderSlotOfferStep(callSid, state, prefix);
    case "day_pick":
      return renderDayPickStep(callSid, state, prefix);
    case "time_pick":
      return renderTimePickStep(state, prefix);
    case "book_more":
      return sayAndGatherDigits(prefix + "לקביעת תור נוסף באותה שיחה הקש 1, לסיום הקש 2.");
    default:
      return transferToBarber();
  }
}

// ---- Step 2: new-caller registration (§7 step 2) ----

async function handleRegisterName(callSid: string, state: CallState, speechResult: string): Promise<NextResponse> {
  const name = speechResult.trim();
  if (!name) return renderStep(callSid, state, "לא הצלחתי לשמוע שם. ");

  state.pending_name = name;
  state.step = "register_confirm";
  setCallState(callSid, state);
  return sayAndGatherDigits(`שמעתי ${name}, נכון? הקש 1 לאישור, 2 לניסיון נוסף.`);
}

async function handleRegisterConfirm(callSid: string, state: CallState, digits: string): Promise<NextResponse> {
  if (digits === "1") {
    const password = generateRandomPassword();
    const result = await registerUserCore(state.pending_name!, state.phone_number!, password);

    if (result.outcome === "blocked") {
      clearCallState(callSid);
      return sayAndHangup("לא ניתן לקבוע תור בקו זה. אנא צרו קשר עם המספרה.");
    }

    let user_id: string;
    let full_name: string;
    if (result.outcome === "phone_taken") {
      // Rare race — the number was registered elsewhere mid-call. Fall back to that account.
      const existing = await prisma.user.findUnique({ where: { phone_number: state.phone_number! } });
      if (!existing) return transferToBarber();
      user_id = existing.id;
      full_name = existing.full_name;
    } else {
      user_id = result.user_id;
      full_name = state.pending_name!;
    }

    state.user_id = user_id;
    state.customer_name = full_name;
    state.step = "barber";
    setCallState(callSid, state);
    return renderBarberStep(callSid, state, "מעולה. ");
  }

  // Any other digit counts as "not confirmed" — try capturing the name again.
  state.name_attempts += 1;
  if (state.name_attempts >= MAX_NAME_ATTEMPTS) {
    clearCallState(callSid);
    return transferToBarber("לא הצלחנו לזהות את שמך. מעביר/ה אותך לספר.");
  }
  state.step = "register_name";
  setCallState(callSid, state);
  return sayAndGatherSpeech("בואו ננסה שוב. מה שמך המלא?");
}

// ---- Step 3: barber selection (§7 step 3) ----

async function renderBarberStep(callSid: string, state: CallState, prefix = ""): Promise<NextResponse> {
  const barbers = await getActiveBarbers();
  if (barbers.length === 0) {
    clearCallState(callSid);
    return sayAndHangup(prefix + "מצטערים, אין כרגע ספרים זמינים לקביעת תור.");
  }
  if (barbers.length === 1) {
    state.barber_id = barbers[0].id;
    state.step = "service";
    setCallState(callSid, state);
    return renderServiceStep(callSid, state, prefix);
  }

  const limited = barbers.slice(0, MAX_MENU_OPTIONS);
  state.barber_options = limited.map((b) => ({ id: b.id, full_name: b.full_name }));
  state.step = "barber";
  setCallState(callSid, state);
  const text = limited.map((b, i) => `ל${b.full_name} הקש ${i + 1}`).join(", ") + ".";
  return sayAndGatherDigits(prefix + "לקביעה אצל " + text);
}

async function handleBarberChoice(callSid: string, state: CallState, digits: string): Promise<NextResponse> {
  const chosen = state.barber_options?.[Number(digits) - 1];
  if (!chosen) return renderBarberStep(callSid, state, "בחירה לא תקינה. ");

  state.barber_id = chosen.id;
  state.step = "service";
  setCallState(callSid, state);
  return renderServiceStep(callSid, state);
}

// ---- Step 4: service selection (§7 step 4) ----

async function renderServiceStep(callSid: string, state: CallState, prefix = ""): Promise<NextResponse> {
  const services = await getServices(state.barber_id!);
  if (services.length === 0) {
    clearCallState(callSid);
    return sayAndHangup(prefix + "מצטערים, אין כרגע שירותים זמינים.");
  }

  const limited = services.slice(0, MAX_MENU_OPTIONS);
  state.service_options = limited.map((s) => ({ id: s.id, name: s.name, is_child_service: s.is_child_service }));
  state.step = "service";
  setCallState(callSid, state);
  const text = limited.map((s, i) => `ל${s.name} הקש ${i + 1}`).join(", ") + ".";
  return sayAndGatherDigits(prefix + text);
}

async function handleServiceChoice(callSid: string, state: CallState, digits: string): Promise<NextResponse> {
  const chosen = state.service_options?.[Number(digits) - 1];
  if (!chosen) return renderServiceStep(callSid, state, "בחירה לא תקינה. ");

  state.service_id = chosen.id;
  state.is_child_service = chosen.is_child_service;
  setCallState(callSid, state);
  return renderSlotOfferStep(callSid, state);
}

// ---- Step 5: date/time — earliest-slot offer, or full day/time pick (§7 step 5) ----

async function renderSlotOfferStep(callSid: string, state: CallState, prefix = ""): Promise<NextResponse> {
  const earliest = await getEarliestAvailability(state.barber_id!, state.service_id!);
  if (!earliest) {
    // §2 decision #15 — no availability at all: apologize and hang up, no waitlist/transfer.
    clearCallState(callSid);
    return sayAndHangup(prefix + "מצטערים, אין כרגע תורים פנויים. נסו שוב מאוחר יותר.");
  }

  state.offered_work_day_id = earliest.work_day_id;
  state.offered_starts_at = earliest.starts_at;
  state.step = "slot_offer";
  setCallState(callSid, state);

  const d = new Date(earliest.starts_at);
  const text = `התור הקרוב ביותר הוא יום ${weekdayDate(d)} בשעה ${formatIsraelTime(d)}. לאישור הקש 1, לבחירת יום אחר הקש 2.`;
  return sayAndGatherDigits(prefix + text);
}

async function handleSlotOffer(callSid: string, state: CallState, digits: string): Promise<NextResponse> {
  if (digits === "1") {
    return finalizeBooking(callSid, state, state.offered_work_day_id!, state.offered_starts_at!);
  }
  if (digits === "2") {
    return renderDayPickStep(callSid, state);
  }
  return renderSlotOfferStep(callSid, state, "בחירה לא תקינה. ");
}

async function renderDayPickStep(callSid: string, state: CallState, prefix = ""): Promise<NextResponse> {
  const openDates = await getOpenDates(state.barber_id!);
  const withAvailability: { work_day_id: string; work_date: string }[] = [];
  for (const day of openDates) {
    const slots = await getSlotsForDate(day.work_day_id, state.service_id!);
    if (slots.length > 0) withAvailability.push({ work_day_id: day.work_day_id, work_date: day.work_date });
    if (withAvailability.length >= MAX_MENU_OPTIONS) break;
  }

  if (withAvailability.length === 0) {
    clearCallState(callSid);
    return sayAndHangup(prefix + "מצטערים, אין כרגע תורים פנויים. נסו שוב מאוחר יותר.");
  }

  state.day_options = withAvailability;
  state.step = "day_pick";
  setCallState(callSid, state);
  const text =
    withAvailability
      .map((d, i) => `ל${weekdayDate(new Date(`${d.work_date}T00:00:00Z`))} הקש ${i + 1}`)
      .join(", ") + ".";
  return sayAndGatherDigits(prefix + "לרשימת הימים הפתוחים: " + text);
}

async function handleDayPick(callSid: string, state: CallState, digits: string): Promise<NextResponse> {
  const chosen = state.day_options?.[Number(digits) - 1];
  if (!chosen) return renderDayPickStep(callSid, state, "בחירה לא תקינה. ");

  const slots = await getSlotsForDate(chosen.work_day_id, state.service_id!);
  const limited = slots.slice(0, MAX_MENU_OPTIONS);
  if (limited.length === 0) {
    // Availability changed between render and choice (race) — back to the day list.
    return renderDayPickStep(callSid, state, "מצטערים, היום הזה כבר לא זמין. ");
  }

  state.time_options = limited;
  state.offered_work_day_id = chosen.work_day_id;
  state.step = "time_pick";
  setCallState(callSid, state);
  return renderTimePickStep(state);
}

async function renderTimePickStep(state: CallState, prefix = ""): Promise<NextResponse> {
  const text =
    (state.time_options ?? []).map((s, i) => `${formatIsraelTime(new Date(s))} הקש ${i + 1}`).join(", ") + ".";
  return sayAndGatherDigits(prefix + text);
}

async function handleTimePick(callSid: string, state: CallState, digits: string): Promise<NextResponse> {
  const chosen = state.time_options?.[Number(digits) - 1];
  if (!chosen) return renderTimePickStep(state, "בחירה לא תקינה. ");

  return finalizeBooking(callSid, state, state.offered_work_day_id!, chosen);
}

// ---- Step 7: confirm + write (§7 step 7) ----

async function finalizeBooking(
  callSid: string,
  state: CallState,
  work_day_id: string,
  starts_at: string,
): Promise<NextResponse> {
  const attendee_name = state.is_child_service ? `ילד/ה של ${state.customer_name}` : undefined;

  const result = await bookViaPhone(
    { work_day_id, service_id: state.service_id!, starts_at, attendee_name },
    { user_id: state.user_id!, customer_name: state.customer_name! },
  );

  if (result.outcome === "slot_taken") {
    // §2 decision #14 — race condition: back to slot selection, not the whole flow.
    return renderSlotOfferStep(callSid, state, "מצטערים, השעה הזו נתפסה הרגע. ");
  }
  if (result.outcome === "error") {
    return renderSlotOfferStep(callSid, state, "אירעה תקלה בקביעת התור, ננסה שוב. ");
  }

  const d = result.booked.starts_at;
  const confirmText = result.pendingApproval
    ? "התור שלך נשמר וממתין לאישור הספר, תקבל/י הודעה כשהוא יאשר."
    : `מעולה, התור נקבע ליום ${weekdayDate(d)} בשעה ${formatIsraelTime(d)}.`;

  state.step = "book_more";
  setCallState(callSid, state);
  return sayAndGatherDigits(`${confirmText} לקביעת תור נוסף באותה שיחה הקש 1, לסיום הקש 2.`);
}

// ---- Step 8: another appointment in the same call? (§7 step 8) ----

async function handleBookMore(callSid: string, state: CallState, digits: string): Promise<NextResponse> {
  if (digits === "1") {
    state.barber_id = undefined;
    state.service_id = undefined;
    state.is_child_service = undefined;
    state.step = "barber";
    setCallState(callSid, state);
    return renderBarberStep(callSid, state);
  }

  clearCallState(callSid);
  return sayAndHangup("תודה, להתראות.");
}
