import { randomUUID } from "crypto";
import { prisma } from "@barberbook/db";
import { PHONE_NUMBER_REGEX } from "@barberbook/shared";

/**
 * Every phone_number in the DB is local Israeli format (0501234567, see
 * PHONE_NUMBER_REGEX). Yemot HaMashiach is an Israeli-only platform, so
 * ApiPhone is expected to already arrive in that same local format — unlike
 * Twilio's E.164 `From`, which needed a real conversion. ⚠️ UNVERIFIED
 * against a real call (docs/# IVR BarberBook.txt "סטטוס" / §2 decision #13)
 * — falls back to stripping a 972/+972 prefix defensively in case Yemot
 * sends it E.164-style after all. Confirm and simplify once decision #19's
 * line is live.
 */
export function normalizeYemotPhone(apiPhone: string | null | undefined): string | null {
  if (!apiPhone) return null;
  const trimmed = apiPhone.trim();
  if (PHONE_NUMBER_REGEX.test(trimmed)) return trimmed;

  const intlMatch = /^\+?972(\d{8,9})$/.exec(trimmed);
  if (intlMatch) {
    const local = `0${intlMatch[1]}`;
    if (PHONE_NUMBER_REGEX.test(local)) return local;
  }
  return null;
}

export type CallerIdentity =
  | { outcome: "no_caller_id" }
  | { outcome: "blocked" }
  | { outcome: "existing_user"; user_id: string; full_name: string }
  | { outcome: "new_caller"; phone_number: string };

/** §7 step 1 of docs/# IVR BarberBook.txt — decisions #12/#13. */
export async function identifyCaller(apiPhone: string | null | undefined): Promise<CallerIdentity> {
  const phone_number = normalizeYemotPhone(apiPhone);
  if (!phone_number) return { outcome: "no_caller_id" };

  const blocked = await prisma.blockedPhoneNumber.findUnique({ where: { phone_number } });
  if (blocked) return { outcome: "blocked" };

  const user = await prisma.user.findUnique({ where: { phone_number } });
  if (user) return { outcome: "existing_user", user_id: user.id, full_name: user.full_name };

  return { outcome: "new_caller", phone_number };
}

/** Random, never-shown password for a phone-registered customer (§2 decision #3) — they set a real one later via "forgot password" (SMS OTP) if they ever want app access. */
export function generateRandomPassword(): string {
  return randomUUID();
}
