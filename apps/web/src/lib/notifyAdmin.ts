import { prisma } from "@barberbook/db";
import { formatIsraelDate, formatIsraelTime } from "@barberbook/shared";
import { sendPushToAdmins } from "@/lib/push";

type NewBookingInfo = {
  appointment_id: string;
  service_name: string;
  customer_name: string;
  starts_at: Date;
};

/** In-app + push — every administrator gets a Notification when a customer books an appointment themselves. Manual bookings created by the admin do not trigger this. */
export async function notifyAdminsOfNewBooking(info: NewBookingInfo): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "administrator" },
    select: { id: true },
  });
  if (admins.length === 0) return;

  const message = `נקבע תור חדש: ${info.service_name} ל${info.customer_name} בתאריך ${formatIsraelDate(info.starts_at)} בשעה ${formatIsraelTime(info.starts_at)}.`;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      user_id: admin.id,
      appointment_id: info.appointment_id,
      type: "appointment_booked" as const,
      content: message,
      status: "sent" as const,
      sent_at: new Date(),
    })),
  });

  await sendPushToAdmins({ title: "תור חדש", body: message, url: "/admin" });
}

/**
 * In-app + push — fires only on the "requires approval" path (bookAppointmentAction/
 * bookViaPhone when getRequiresApproval() is true), where notifyAdminsOfNewBooking is
 * skipped in favor of this: the appointment already holds the slot, but the admin still
 * needs to actively approve/reject it in /admin/booking-requests.
 */
export async function notifyAdminsOfBookingRequest(info: NewBookingInfo): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "administrator" },
    select: { id: true },
  });
  if (admins.length === 0) return;

  const message = `בקשת תור ממתינה לאישור: ${info.service_name} ל${info.customer_name} בתאריך ${formatIsraelDate(info.starts_at)} בשעה ${formatIsraelTime(info.starts_at)}.`;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      user_id: admin.id,
      appointment_id: info.appointment_id,
      type: "booking_request_pending" as const,
      content: message,
      status: "sent" as const,
      sent_at: new Date(),
    })),
  });

  await sendPushToAdmins({ title: "בקשת תור חדשה", body: message, url: "/admin/booking-requests" });
}

type CancellationRequestInfo = {
  cancellation_request_id: string;
  service_name: string;
  customer_name: string;
  starts_at: Date;
};

/**
 * In-app + push — fires when a customer's cancellation only creates a pending
 * CancellationRequest (getRequiresApproval() is true); the immediate-cancellation
 * path (approval off) doesn't create a request at all, so there's nothing to notify here.
 */
export async function notifyAdminsOfCancellationRequest(info: CancellationRequestInfo): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "administrator" },
    select: { id: true },
  });
  if (admins.length === 0) return;

  const message = `בקשת ביטול ממתינה לאישור: ${info.service_name} של ${info.customer_name} בתאריך ${formatIsraelDate(info.starts_at)} בשעה ${formatIsraelTime(info.starts_at)}.`;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      user_id: admin.id,
      cancellation_request_id: info.cancellation_request_id,
      type: "cancellation_request_pending" as const,
      content: message,
      status: "sent" as const,
      sent_at: new Date(),
    })),
  });

  await sendPushToAdmins({ title: "בקשת ביטול חדשה", body: message, url: "/admin/cancellation-requests" });
}
