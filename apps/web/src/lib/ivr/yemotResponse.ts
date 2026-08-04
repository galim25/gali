import { NextResponse } from "next/server";

/**
 * Field names *we* choose for the value that comes back on the next request
 * (§2 decision #18 of docs/# IVR BarberBook.txt — Yemot lets the caller name
 * this, unlike Twilio's fixed Digits/SpeechResult). Kept here so the route
 * that reads the response and this file that writes the `read=` command
 * can't drift apart.
 */
export const DTMF_FIELD = "DIGIT_CHOICE";
export const SPEECH_FIELD = "SPEECH_RESULT";

function textPlain(body: string): NextResponse {
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * ⚠️ UNVERIFIED (docs/# IVR BarberBook.txt "סטטוס") — community documentation
 * for Yemot's response syntax lists period/hyphen/apostrophe/quotation-mark/
 * ampersand as characters that collide with the response's own field/command
 * separators (`,`/`=`/`&`/`-`). flow.ts's prompts use periods and commas
 * freely (Twilio's TwiML had no such restriction), so strip the documented
 * troublemakers defensively rather than risk a corrupted response once a real
 * call exercises this. Revisit once decision #19's line is live and a real
 * request/response has been inspected.
 */
function sanitize(text: string): string {
  return text.replace(/[.\-'"&]/g, "");
}

/** Every DTMF menu in this feature is capped at 9 numbered options (see flow.ts) so a single digit always suffices. */
export function sayAndGatherDigits(text: string): NextResponse {
  const prompt = sanitize(text);
  // read=t-{prompt}={field},{re_enter_if_exists},{min_digits},{max_digits},{type},{allow_empty}
  return textPlain(`read=t-${prompt}=${DTMF_FIELD},,1,1,Digits,yes`);
}

/**
 * ⚠️ UNVERIFIED — "Speech" as the `read=` type keyword for speech-to-text is
 * inferred from yemot-router2's `mode: 'stt'`, not confirmed against Yemot's
 * own raw protocol docs. Confirm the exact keyword against a real call before
 * relying on this for §7 step 2 (new-caller name capture).
 */
export function sayAndGatherSpeech(text: string): NextResponse {
  const prompt = sanitize(text);
  return textPlain(`read=t-${prompt}=${SPEECH_FIELD},,0,,Speech,yes`);
}

export function sayAndHangup(text: string): NextResponse {
  const prompt = sanitize(text);
  return textPlain(`id_list_message=t-${prompt}&go_to_folder=hangup`);
}
