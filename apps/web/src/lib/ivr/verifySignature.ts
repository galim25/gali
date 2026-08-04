import twilio from "twilio";
import { publicBaseUrl } from "@/lib/ivr/publicUrl";

/**
 * Twilio signs every webhook request with X-Twilio-Signature, computed over
 * the exact URL it POSTed to plus the sorted form params — verifying this is
 * the only thing standing between "a real phone call" and "anyone on the
 * internet POSTing fake CallSid/Digits/SpeechResult values" straight at
 * these routes. PUBLIC_BASE_URL must match, byte for byte, whatever's
 * configured as the Twilio webhook URL (protocol+host) or every request
 * fails verification — see docs/# IVR BarberBook.txt §4. Takes the route's
 * own path (not a full URL) so a missing PUBLIC_BASE_URL — expected before
 * the feature is configured — fails closed (403) instead of throwing a 500;
 * callers don't need their own try/catch for that.
 */
export function verifyTwilioSignature(
  path: string,
  params: Record<string, string>,
  signature: string | null,
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || !signature) return false;

  let fullUrl: string;
  try {
    fullUrl = `${publicBaseUrl()}${path}`;
  } catch {
    return false;
  }
  return twilio.validateRequest(authToken, signature, fullUrl, params);
}
