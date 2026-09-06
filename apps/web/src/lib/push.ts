import webpush from "web-push";
import { prisma } from "@barberbook/db";

/**
 * Real Web Push (device/browser notification, works even with the app
 * closed) — separate from the in-app Notification feed in notifyAdmin.ts.
 * Requires VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT in the
 * environment (see .env.example); silently does nothing without them so a
 * missing/not-yet-configured deploy never breaks booking/cancellation flows.
 */
function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

let configured = false;
function ensureConfigured(config: { publicKey: string; privateKey: string; subject: string }) {
  if (configured) return;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Relative path opened when the notification is tapped, e.g. "/admin/booking-requests". */
  url: string;
};

/** Sends a real push notification to every administrator's subscribed devices. No-op if VAPID isn't configured. */
export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  const config = getVapidConfig();
  if (!config) return;
  ensureConfigured(config);

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { user: { role: "administrator" } },
  });
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
      } catch (err) {
        // 404/410 means the browser dropped the subscription (uninstalled, cleared data, expired) — stop targeting it.
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}
