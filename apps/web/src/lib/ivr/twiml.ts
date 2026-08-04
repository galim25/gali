import twilio from "twilio";
import { NextResponse } from "next/server";
import { publicBaseUrl } from "@/lib/ivr/publicUrl";

const { VoiceResponse } = twilio.twiml;

const VOICE_LANG = "he-IL";
const GATHER_PATH = "/api/ivr/gather";

function xmlResponse(twiml: InstanceType<typeof VoiceResponse>): NextResponse {
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

/** Every DTMF menu in this feature is capped at 9 numbered options (see flow.ts) so a single digit, gathered without waiting for '#', always suffices. */
export function sayAndGatherDigits(text: string): NextResponse {
  const r = new VoiceResponse();
  const gather = r.gather({
    input: ["dtmf"],
    numDigits: 1,
    action: `${publicBaseUrl()}${GATHER_PATH}`,
    method: "POST",
    timeout: 6,
  });
  gather.say({ language: VOICE_LANG }, text);
  return xmlResponse(r);
}

export function sayAndGatherSpeech(text: string): NextResponse {
  const r = new VoiceResponse();
  const gather = r.gather({
    input: ["speech"],
    language: VOICE_LANG,
    action: `${publicBaseUrl()}${GATHER_PATH}`,
    method: "POST",
    timeout: 6,
    speechTimeout: "auto",
  });
  gather.say({ language: VOICE_LANG }, text);
  return xmlResponse(r);
}

export function sayAndHangup(text: string): NextResponse {
  const r = new VoiceResponse();
  r.say({ language: VOICE_LANG }, text);
  r.hangup();
  return xmlResponse(r);
}

/** Fallback for "anything that isn't a new booking" (§2 decision 11) and every no-input/no-match safety net in flow.ts. */
export function transferToBarber(text?: string): NextResponse {
  const number = process.env.IVR_TRANSFER_NUMBER;
  const r = new VoiceResponse();
  if (text) r.say({ language: VOICE_LANG }, text);
  if (!number) {
    // Misconfiguration safety net — never leave the caller stuck with silence.
    r.say({ language: VOICE_LANG }, "מצטערים, לא ניתן להעביר את השיחה כרגע.");
    r.hangup();
    return xmlResponse(r);
  }
  r.dial(number);
  return xmlResponse(r);
}
