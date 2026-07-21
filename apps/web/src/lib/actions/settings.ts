"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@barberbook/db";
import { getSession } from "@/lib/auth/session";
import type { BookingResult } from "@/lib/actions/booking";

const SETTINGS_ID = "singleton";

/**
 * Global switch (not per-day, per US request) — when true, every customer
 * booking/cancellation needs the barber's explicit approval; when false,
 * both happen instantly. Public read: the customer-facing booking flow also
 * needs this to decide what copy to show.
 */
export async function getRequiresApproval(): Promise<boolean> {
  const settings = await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
  return settings.requires_approval;
}

export async function setRequiresApprovalAction(value: boolean): Promise<BookingResult> {
  const session = await getSession();
  if (!session || session.role !== "administrator") return { error: "אין הרשאה" };

  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { requires_approval: value },
    create: { id: SETTINGS_ID, requires_approval: value },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
