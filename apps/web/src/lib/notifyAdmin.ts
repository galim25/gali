import { prisma } from "@barberbook/db";
import { formatIsraelDate, formatIsraelTime } from "@barberbook/shared";

type NewBookingInfo = {
  appointment_id: string;
  service_name: string;
  customer_name: string;
  starts_at: Date;
};

/** In-app only (no SMS) — every administrator gets a Notification when a customer books an appointment themselves. Manual bookings created by the admin do not trigger this. */
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
}
