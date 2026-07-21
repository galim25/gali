"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@barberbook/db";
import { formatIsraelDate, formatIsraelTime } from "@barberbook/shared";
import { getSession } from "@/lib/auth/session";
import { sendCustomerNotification } from "@/lib/notifyCustomer";
import type { BookingResult } from "@/lib/actions/booking";

async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.role !== "administrator") return null;
  return session;
}

/**
 * General waitlist (US extension) — not tied to a specific service or date.
 * user_id is @unique on WaitlistEntry, so joining again while already on the
 * list is a no-op rather than a duplicate/error.
 */
export async function joinWaitlistAction(): Promise<BookingResult> {
  const session = await getSession();
  if (!session) return { error: "יש להתחבר" };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.sub },
    select: { phone_number: true },
  });

  await prisma.waitlistEntry.upsert({
    where: { user_id: session.sub },
    update: {},
    create: {
      user_id: session.sub,
      customer_name: session.full_name,
      phone_number: user.phone_number,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/book");
  return { success: true };
}

export async function leaveWaitlistAction(): Promise<BookingResult> {
  const session = await getSession();
  if (!session) return { error: "יש להתחבר" };

  await prisma.waitlistEntry.deleteMany({ where: { user_id: session.sub } });

  revalidatePath("/account");
  revalidatePath("/account/book");
  return { success: true };
}

export async function isOnWaitlist(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const entry = await prisma.waitlistEntry.findUnique({ where: { user_id: session.sub } });
  return entry !== null;
}

export type WaitlistEntryView = {
  id: string;
  customer_name: string;
  phone_number: string;
  created_at: Date;
};

export async function getWaitlistEntries(): Promise<WaitlistEntryView[]> {
  if (!(await requireAdminSession())) return [];
  const entries = await prisma.waitlistEntry.findMany({ orderBy: { created_at: "asc" } });
  return entries.map((e) => ({
    id: e.id,
    customer_name: e.customer_name,
    phone_number: e.phone_number,
    created_at: e.created_at,
  }));
}

export async function removeWaitlistEntryAction(id: string): Promise<BookingResult> {
  if (!(await requireAdminSession())) return { error: "אין הרשאה" };
  await prisma.waitlistEntry.delete({ where: { id } });
  revalidatePath("/admin/waitlist");
  return { success: true };
}

async function notifyAllWaitlistEntries(message: string): Promise<void> {
  const entries = await prisma.waitlistEntry.findMany();
  for (const entry of entries) {
    await sendCustomerNotification({
      user_id: entry.user_id,
      phone_number: entry.phone_number,
      message,
      type: "waitlist_slot_available",
    });
  }
}

/**
 * Called whenever a scheduled appointment frees up (admin cancels it, or a
 * customer's cancellation request is approved) — notifies every waitlist
 * entry that a slot opened at that time. Entries stay on the list afterward
 * (no auto-removal); the admin or the customer removes them explicitly.
 */
export async function notifyWaitlistOfFreedSlot(starts_at: Date, service_name: string): Promise<void> {
  await notifyAllWaitlistEntries(
    `התפנה תור ל${service_name} בתאריך ${formatIsraelDate(starts_at)} בשעה ${formatIsraelTime(starts_at)} — מיהרו לקבוע!`,
  );
}

/**
 * Called whenever the barber extends an already-open work day's hours
 * (earlier start and/or later end than before) — this can surface new slots
 * without any specific appointment having been freed, so it's a distinct
 * trigger from notifyWaitlistOfFreedSlot.
 */
export async function notifyWaitlistOfExtendedHours(work_date: Date): Promise<void> {
  await notifyAllWaitlistEntries(
    `נפתחו שעות נוספות בתאריך ${formatIsraelDate(work_date)} — כדאי לבדוק אם יש תור מתאים!`,
  );
}
