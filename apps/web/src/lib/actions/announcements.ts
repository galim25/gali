"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@barberbook/db";
import { getSession } from "@/lib/auth/session";

async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.role !== "administrator") return null;
  return session;
}

export type AnnouncementView = { id: string; title: string; content: string; published_at: Date };

export async function getAnnouncements(): Promise<AnnouncementView[]> {
  return prisma.announcement.findMany({
    orderBy: { published_at: "desc" },
    select: { id: true, title: true, content: true, published_at: true },
  });
}

export type CreateAnnouncementResult = { error?: string; success?: boolean };

export async function createAnnouncementAction(input: {
  title: string;
  content: string;
}): Promise<CreateAnnouncementResult> {
  const session = await requireAdminSession();
  if (!session) return { error: "אין הרשאה" };

  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) return { error: "יש למלא כותרת ותוכן" };

  await prisma.announcement.create({
    data: { title, content, published_by_user_id: session.sub },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/account");
  return { success: true };
}

export async function updateAnnouncementAction(input: {
  id: string;
  title: string;
  content: string;
}): Promise<CreateAnnouncementResult> {
  const session = await requireAdminSession();
  if (!session) return { error: "אין הרשאה" };

  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) return { error: "יש למלא כותרת ותוכן" };

  await prisma.announcement.update({
    where: { id: input.id },
    data: { title, content },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/account");
  return { success: true };
}

export async function deleteAnnouncementAction(id: string): Promise<CreateAnnouncementResult> {
  const session = await requireAdminSession();
  if (!session) return { error: "אין הרשאה" };

  await prisma.announcement.delete({ where: { id } });

  revalidatePath("/admin/announcements");
  revalidatePath("/account");
  return { success: true };
}
