import { randomUUID } from "crypto";
import { prisma } from "@barberbook/db";
import { PHONE_NUMBER_REGEX } from "@barberbook/shared";

/**
 * Twilio's `From` on an incoming call is E.164 (+972501234567); every
 * phone_number in the DB is local Israeli format (0501234567, see
 * PHONE_NUMBER_REGEX) — this is the one place that bridges the two. A
 * non-+972 caller ID returns null (out of scope, same Israeli-numbers-only
 * assumption the rest of the app already makes via PHONE_NUMBER_REGEX).
 */
export function e164ToIsraeliLocal(from: string | null | undefined): string | null {
  if (!from) return null;
  const match = /^\+972(\d{8,9})$/.exec(from);
  if (!match) return null;
  const local = `0${match[1]}`;
  return PHONE_NUMBER_REGEX.test(local) ? local : null;
}

export type CallerIdentity =
  | { outcome: "no_caller_id" }
  | { outcome: "blocked" }
  | { outcome: "existing_user"; user_id: string; full_name: string }
  | { outcome: "new_caller"; phone_number: string };

/** §7 step 1 of docs/# IVR BarberBook.txt — decisions #12/#13. */
export async function identifyCaller(from: string | null | undefined): Promise<CallerIdentity> {
  const phone_number = e164ToIsraeliLocal(from);
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
