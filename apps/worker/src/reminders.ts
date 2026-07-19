import { prisma } from "@barberbook/db";
import {
  APPOINTMENT_REMINDER_LEAD_MINUTES,
  formatIsraelDate,
  formatIsraelTime,
  getSmsProvider,
} from "@barberbook/shared";

/**
 * Sends a reminder for every scheduled appointment starting within the lead
 * window that doesn't already have one. Idempotent across polls: the schema
 * has no separate "reminder_sent" flag, so "no existing appointment_reminder
 * Notification for this appointment" is the only guard against duplicates.
 * Appointments with no linked account (booked_by_user_id null) have no
 * phone number to reach and are skipped.
 */
export async function sendDueReminders(): Promise<void> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + APPOINTMENT_REMINDER_LEAD_MINUTES * 60_000);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "scheduled",
      starts_at: { gte: now, lte: windowEnd },
      booked_by_user_id: { not: null },
      notifications: { none: { type: "appointment_reminder" } },
    },
    include: { service: true, booked_by: true },
  });

  for (const appointment of appointments) {
    if (!appointment.booked_by) continue;

    const message = `תזכורת: יש לך תור ל${appointment.service.name} בתאריך ${formatIsraelDate(appointment.starts_at)} בשעה ${formatIsraelTime(appointment.starts_at)}.`;

    await getSmsProvider().send(appointment.booked_by.phone_number, message);
    await prisma.notification.create({
      data: {
        user_id: appointment.booked_by.id,
        appointment_id: appointment.id,
        type: "appointment_reminder",
        content: message,
        status: "sent",
        sent_at: new Date(),
      },
    });
  }
}
