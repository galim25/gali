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
 * 2026-08-08 (caller feedback — sentences were running into each other with
 * no gap, e.g. "...נקבע לשעה 13:15.לקביעת תור נוסף..."): each array element
 * becomes its own `t-` segment, `.`-joined. That period is the same
 * `id_list_message=`/`read=` announcement-segment separator documented in
 * `sanitize()` below (`t-foo.f-/8/bar`) — playing back-to-back TTS segments
 * this way is the only pause mechanism this project has found evidence of;
 * there's no documented explicit "silence=" or "sleep=" directive. Empty/
 * blank parts (e.g. an unused `prefix = ""`) are dropped so callers don't
 * have to special-case the no-prefix case.
 */
function buildSegments(text: string | string[]): string {
  const parts = Array.isArray(text) ? text : [text];
  return parts
    .map((p) => p.trim())
    .filter((p) => p !== "")
    .map((p) => `t-${sanitize(p)}`)
    .join(".");
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
export function sayAndGatherDigits(text: string | string[]): NextResponse {
  return textPlain(`read=${buildSegments(text)}=${DTMF_FIELD},,1,1`);
}

/**
 * Speech-recognition `read=` syntax confirmed 2026-08-05 (freeivr.co.il post
 * 76): `read=[announcement]=[param],,voice[,language][,allow_dtmf][,max_digits]`
 * — the literal keyword is `voice`, not `Speech` as previously guessed (§2
 * decision #2's ⚠️ is now resolved). `he-IL` requested for Hebrew name
 * capture (§7 step 2). Still unverified against a real call.
 */
export function sayAndGatherSpeech(text: string | string[]): NextResponse {
  return textPlain(`read=${buildSegments(text)}=${SPEECH_FIELD},,voice,he-IL`);
}

export function sayAndHangup(text: string | string[]): NextResponse {
  return textPlain(`id_list_message=${buildSegments(text)}&go_to_folder=hangup`);
}
