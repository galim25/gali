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
