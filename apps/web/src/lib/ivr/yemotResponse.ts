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
 * Confirmed 2026-08-05 against community API reference (freeivr.co.il forum,
 * post 76, "מודול API"): the only characters Yemot's own response syntax
 * forbids inside dynamic `t-` text are period and hyphen (period doubles as
 * the `id_list_message=` item separator, e.g. `t-foo.f-/8/bar`). `&` is
 * additionally stripped here — not because Yemot forbids it, but because
 * *our* `sayAndHangup` joins two response commands with `&`
 * (`id_list_message=...&go_to_folder=hangup`); a stray `&` in dynamic text
 * would prematurely end that command the same way it would in a query
 * string. Still not verified against a real call (no line yet at the time
 * of this update) — only against the forum's written spec.
 */
function sanitize(text: string): string {
  return text.replace(/[.\-&]/g, "");
}

/**
 * `read=` syntax confirmed 2026-08-05 (freeivr.co.il post 76):
 * `read=[announcement]=[param],[reuse],[max_digits],[min_digits],[timeout],[echo_mode],...`
 * — trailing optional fields may be omitted. Every DTMF menu in this feature
 * is capped at 9 numbered options (see flow.ts) so max=min=1 always suffices.
 * (Previously this put the literal strings "Digits"/"yes" in the
 * timeout/echo_mode slots — a real bug from guessing the field order before
 * the syntax was confirmed.)
 */
export function sayAndGatherDigits(text: string): NextResponse {
  const prompt = sanitize(text);
  return textPlain(`read=t-${prompt}=${DTMF_FIELD},,1,1`);
}

/**
 * Speech-recognition `read=` syntax confirmed 2026-08-05 (freeivr.co.il post
 * 76): `read=[announcement]=[param],,voice[,language][,allow_dtmf][,max_digits]`
 * — the literal keyword is `voice`, not `Speech` as previously guessed (§2
 * decision #2's ⚠️ is now resolved). `he-IL` requested for Hebrew name
 * capture (§7 step 2). Still unverified against a real call.
 */
export function sayAndGatherSpeech(text: string): NextResponse {
  const prompt = sanitize(text);
  return textPlain(`read=t-${prompt}=${SPEECH_FIELD},,voice,he-IL`);
}

export function sayAndHangup(text: string): NextResponse {
  const prompt = sanitize(text);
  return textPlain(`id_list_message=t-${prompt}&go_to_folder=hangup`);
}
