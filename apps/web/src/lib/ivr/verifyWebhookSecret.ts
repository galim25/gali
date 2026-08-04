import { timingSafeEqual } from "crypto";

/**
 * Yemot HaMashiach has no documented request-signing mechanism (no
 * X-Twilio-Signature equivalent — §2 decision #17 of docs/# IVR
 * BarberBook.txt, ⚠️ unverified against a real account: every community
 * source checked describes the webhook URL itself, `api_link`, as the only
 * thing standing between "a real phone call" and "anyone on the internet
 * POSTing fake ApiCallId/ApiPhone values" at this route). The secret path
 * segment configured as YEMOT_WEBHOOK_SECRET *is* that URL-secrecy — treat it
 * like a bearer credential, not a routing detail. Fails closed (false) if
 * YEMOT_WEBHOOK_SECRET isn't set, same fail-closed principle the old
 * verifyTwilioSignature used for a missing TWILIO_AUTH_TOKEN.
 */
export function verifyWebhookSecret(pathSecret: string | undefined): boolean {
  const expected = process.env.YEMOT_WEBHOOK_SECRET;
  if (!expected || !pathSecret) return false;

  const a = Buffer.from(pathSecret);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Defense-in-depth only, not real security (§2 decision #17) — logs a
 * mismatch instead of blocking, since the exact ApiDID format Yemot sends is
 * ⚠️ unverified and a false positive here must never take the line down.
 */
export function warnIfUnexpectedDid(apiDid: string | null | undefined): void {
  const expected = process.env.YEMOT_PHONE_NUMBER;
  if (!expected || !apiDid) return;
  if (apiDid !== expected) {
    console.warn(`[ivr] ApiDID "${apiDid}" does not match configured YEMOT_PHONE_NUMBER "${expected}"`);
  }
}
