"use server";

import { prisma } from "@barberbook/db";
import { localDateToUtcMidnight } from "@barberbook/shared";
import { getSession } from "@/lib/auth/session";
import { findAvailableSlots, isSlotAvailable, type Interval } from "@/lib/availability";
import { runSerializable } from "@/lib/serializableTransaction";
import { notifyAdminsOfNewBooking } from "@/lib/notifyAdmin";
import { getRequiresApproval } from "@/lib/actions/settings";

export type ServiceOption = {
  id: string;
  name: string;
  duration_minutes: number;
  is_child_service: boolean;
};
export type OpenDate = { work_day_id: string; work_date: string };
export type BookingResult = { error?: string; success?: boolean; pendingApproval?: boolean };

export async function getServices(): Promise<ServiceOption[]> {
  return prisma.service.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, duration_minutes: true, is_child_service: true },
  });
}

export async function getOpenDates(): Promise<OpenDate[]> {
  const today = localDateToUtcMidnight();
  const days = await prisma.workDay.findMany({
    where: { work_date: { gte: today } },
    orderBy: { work_date: "asc" },
    select: { id: true, work_date: true },
  });
  return days.map((d) => ({ work_day_id: d.id, work_date: d.work_date.toISOString().slice(0, 10) }));
}

async function loadBusyIntervals(
  work_day_id: string,
  excludeAppointmentId?: string,
): Promise<{ work_day: Interval; busy: Interval[] }> {
  const workDay = await prisma.workDay.findUniqueOrThrow({
    where: { id: work_day_id },
    include: {
      breaks: true,
      blocked_times: true,
      appointments: { where: { status: "scheduled" } },
    },
  });

  const busy: Interval[] = [
    ...workDay.breaks.map((b) => ({ starts_at: b.starts_at, ends_at: b.ends_at })),
    ...workDay.blocked_times.map((b) => ({ starts_at: b.starts_at, ends_at: b.ends_at })),
    ...workDay.appointments
      .filter((a) => a.id !== excludeAppointmentId)
      .map((a) => ({ starts_at: a.starts_at, ends_at: a.ends_at })),
  ];

  return { work_day: { starts_at: workDay.starts_at, ends_at: workDay.ends_at }, busy };
}

export async function getSlotsForDate(
  work_day_id: string,
  service_id: string,
  excludeAppointmentId?: string,
): Promise<string[]> {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: service_id } });
  const { work_day, busy } = await loadBusyIntervals(work_day_id, excludeAppointmentId);
  const now = new Date();
  return findAvailableSlots({
    work_day,
    busy,
    duration_minutes: service.duration_minutes,
  })
    .filter((d) => d >= now)
    .map((d) => d.toISOString());
}

type CreateAppointmentInput = {
  work_day_id: string;
  service_id: string;
  starts_at: string;
  /** Required when the chosen service is a child service; ignored otherwise. */
  attendee_name?: string;
};

async function isCustomerBlocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone_number: true } });
  if (!user) return false;
  const blocked = await prisma.blockedPhoneNumber.findUnique({ where: { phone_number: user.phone_number } });
  return !!blocked;
}

export async function bookAppointmentAction(input: CreateAppointmentInput): Promise<BookingResult> {
  const session = await getSession();
  if (!session) return { error: "יש להתחבר כדי לקבוע תור" };
  if (await isCustomerBlocked(session.sub)) {
    return { error: "לא ניתן לקבוע תורים בחשבון זה. יש ליצור קשר עם הספר" };
  }

  const requiresApproval = await getRequiresApproval();

  try {
    const booked = await runSerializable(async (tx) => {
      const service = await tx.service.findUniqueOrThrow({ where: { id: input.service_id } });
      const workDay = await tx.workDay.findUniqueOrThrow({
        where: { id: input.work_day_id },
        include: {
          breaks: true,
          blocked_times: true,
          appointments: { where: { status: "scheduled" } },
        },
      });
      const busy: Interval[] = [
        ...workDay.breaks.map((b) => ({ starts_at: b.starts_at, ends_at: b.ends_at })),
        ...workDay.blocked_times.map((b) => ({ starts_at: b.starts_at, ends_at: b.ends_at })),
        ...workDay.appointments.map((a) => ({ starts_at: a.starts_at, ends_at: a.ends_at })),
      ];

      const starts_at = new Date(input.starts_at);
      if (starts_at < new Date()) {
        throw new Error("PAST_SLOT");
      }
      const ok = isSlotAvailable(
        starts_at,
        service.duration_minutes,
        { starts_at: workDay.starts_at, ends_at: workDay.ends_at },
        busy,
      );
      if (!ok) {
        throw new Error("SLOT_TAKEN");
      }

      const attendee_name = input.attendee_name?.trim();
      if (service.is_child_service && !attendee_name) {
        throw new Error("ATTENDEE_NAME_REQUIRED");
      }

      const appointment = await tx.appointment.create({
        data: {
          work_day_id: input.work_day_id,
          service_id: input.service_id,
          booked_by_user_id: session.sub,
          customer_name: session.full_name,
          attendee_name: service.is_child_service ? attendee_name! : session.full_name,
          attendee_type: service.is_child_service ? "child" : "self",
          starts_at,
          ends_at: new Date(starts_at.getTime() + service.duration_minutes * 60_000),
          status: "scheduled",
        },
      });

      if (requiresApproval) {
        await tx.bookingRequest.create({ data: { appointment_id: appointment.id } });
      }

      return {
        appointment_id: appointment.id,
        service_name: service.name,
        customer_name: session.full_name,
        starts_at,
      };
    });

    if (requiresApproval) {
      return { success: true, pendingApproval: true };
    }
    await notifyAdminsOfNewBooking(booked);
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return { error: "השעה כבר תפוסה — יש לבחור שעה אחרת" };
    }
    if (err instanceof Error && err.message === "PAST_SLOT") {
      return { error: "לא ניתן לקבוע תור לשעה שכבר עברה" };
    }
    if (err instanceof Error && err.message === "ATTENDEE_NAME_REQUIRED") {
      return { error: "יש להזין את שם הילד/ה" };
    }
    // Serializable transactions can fail under concurrent writes to the same day; treat as a retry-worthy conflict.
    return { error: "לא ניתן היה לשמור את התור, נסה/י שוב" };
  }
}

type RescheduleInput = {
  appointment_id: string;
  work_day_id: string;
  starts_at: string;
};

export async function rescheduleAppointmentAction(input: RescheduleInput): Promise<BookingResult> {
  const session = await getSession();
  if (!session) return { error: "יש להתחבר" };
  if (await isCustomerBlocked(session.sub)) {
    return { error: "לא ניתן לשנות תורים בחשבון זה. יש ליצור קשר עם הספר" };
  }

  try {
    await runSerializable(async (tx) => {
      const appointment = await tx.appointment.findUniqueOrThrow({
        where: { id: input.appointment_id },
        include: { service: true },
      });
      if (appointment.booked_by_user_id !== session.sub) {
        throw new Error("FORBIDDEN");
      }

      const workDay = await tx.workDay.findUniqueOrThrow({
        where: { id: input.work_day_id },
        include: {
          breaks: true,
          blocked_times: true,
          appointments: { where: { status: "scheduled" } },
        },
      });
      const busy: Interval[] = [
        ...workDay.breaks.map((b) => ({ starts_at: b.starts_at, ends_at: b.ends_at })),
        ...workDay.blocked_times.map((b) => ({ starts_at: b.starts_at, ends_at: b.ends_at })),
        ...workDay.appointments
          .filter((a) => a.id !== appointment.id)
          .map((a) => ({ starts_at: a.starts_at, ends_at: a.ends_at })),
      ];

      const starts_at = new Date(input.starts_at);
      if (starts_at < new Date()) {
        throw new Error("PAST_SLOT");
      }
      const ok = isSlotAvailable(
        starts_at,
        appointment.service.duration_minutes,
        { starts_at: workDay.starts_at, ends_at: workDay.ends_at },
        busy,
      );
      if (!ok) throw new Error("SLOT_TAKEN");

      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          work_day_id: input.work_day_id,
          starts_at,
          ends_at: new Date(starts_at.getTime() + appointment.service.duration_minutes * 60_000),
        },
      });
    });
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return { error: "השעה כבר תפוסה — יש לבחור שעה אחרת" };
    }
    if (err instanceof Error && err.message === "PAST_SLOT") {
      return { error: "לא ניתן לשנות תור לשעה שכבר עברה" };
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { error: "אין הרשאה לשנות תור זה" };
    }
    return { error: "לא ניתן היה לעדכן את התור, נסה/י שוב" };
  }
}
