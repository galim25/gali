"use server";

import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@barberbook/db";
import { PHONE_NUMBER_REGEX } from "@barberbook/shared";
import { getSession } from "@/lib/auth/session";

export type BlockedPhoneNumberView = {
  id: string;
  phone_number: string;
  reason: string | null;
  created_at: Date;
};
export type BlocklistResult = { error?: string; success?: boolean };

async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.role !== "administrator") return null;
  return session;
}

export async function getBlockedPhoneNumbers(): Promise<BlockedPhoneNumberView[]> {
  if (!(await requireAdminSession())) return [];
  return prisma.blockedPhoneNumber.findMany({
    orderBy: { created_at: "desc" },
    select: { id: true, phone_number: true, reason: true, created_at: true },
  });
}

export async function blockPhoneNumberAction(input: {
  phone_number: string;
  reason?: string;
}): Promise<BlocklistResult> {
  const session = await requireAdminSession();
  if (!session) return { error: "אין הרשאה" };

  const phone_number = input.phone_number.trim();
  if (!PHONE_NUMBER_REGEX.test(phone_number)) {
    return { error: "מספר טלפון לא תקין" };
  }

  try {
    await prisma.blockedPhoneNumber.create({
      data: {
        phone_number,
        reason: input.reason?.trim() || null,
        blocked_by_user_id: session.sub,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "מספר זה כבר חסום" };
    }
    return { error: "לא ניתן היה לחסום את המספר, נסה/י שוב" };
  }

  revalidatePath("/admin/blocked-customers");
  return { success: true };
}

export async function unblockPhoneNumberAction(id: string): Promise<BlocklistResult> {
  if (!(await requireAdminSession())) return { error: "אין הרשאה" };

  await prisma.blockedPhoneNumber.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/blocked-customers");
  return { success: true };
}
