"use server";

import { prisma } from "@barberbook/db";
import { getSession } from "@/lib/auth/session";
import type { BookingResult } from "@/lib/actions/booking";

type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Called once per browser/device when the admin turns push notifications on. */
export async function subscribeToPushAction(subscription: SubscriptionInput): Promise<BookingResult> {
  const session = await getSession();
  if (!session || session.role !== "administrator") return { error: "אין הרשאה" };

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { user_id: session.sub, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      user_id: session.sub,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return { success: true };
}

/** Called when the admin turns push notifications off on this device, or the browser reports the subscription expired. */
export async function unsubscribeFromPushAction(endpoint: string): Promise<BookingResult> {
  const session = await getSession();
  if (!session || session.role !== "administrator") return { error: "אין הרשאה" };

  await prisma.pushSubscription.deleteMany({ where: { endpoint, user_id: session.sub } });
  return { success: true };
}
