"use server";

import { redirect } from "next/navigation";
import { prisma } from "@barberbook/db";
import { getSmsProvider, PASSWORD_RESET_CODE_TTL_MINUTES } from "@barberbook/shared";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation";

export type ActionState = { error?: string; success?: boolean };

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    phone_number: formData.get("phone_number"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }
  const { full_name, phone_number, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone_number } });
  if (existing) {
    return { error: "מספר הטלפון כבר רשום במערכת" };
  }

  const blocked = await prisma.blockedPhoneNumber.findUnique({ where: { phone_number } });
  if (blocked) {
    return { error: "לא ניתן להירשם עם מספר טלפון זה" };
  }

  const user = await prisma.user.create({
    data: {
      full_name,
      phone_number,
      password_hash: await hashPassword(password),
      role: "customer",
    },
  });

  await createSession({ sub: user.id, role: user.role, full_name: user.full_name });
  redirect("/account");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    phone_number: formData.get("phone_number"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }
  const { phone_number, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone_number } });
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: "מספר טלפון או סיסמה שגויים" };
  }

  await createSession({ sub: user.id, role: user.role, full_name: user.full_name });
  redirect(user.role === "administrator" ? "/admin" : "/account");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ phone_number: formData.get("phone_number") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "מספר טלפון לא תקין" };
  }
  const { phone_number } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone_number } });
  // Always report success even if the phone isn't registered, to avoid leaking account existence.
  if (user) {
    const code = generateOtp();
    await prisma.passwordResetCode.create({
      data: {
        user_id: user.id,
        code,
        expires_at: new Date(Date.now() + PASSWORD_RESET_CODE_TTL_MINUTES * 60_000),
      },
    });
    await getSmsProvider().send(phone_number, `קוד האימות שלך לאיפוס סיסמה ב-BarberBook: ${code}`);
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    phone_number: formData.get("phone_number"),
    code: formData.get("code"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }
  const { phone_number, code, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone_number } });
  if (!user) {
    return { error: "קוד לא תקין או שפג תוקפו" };
  }

  const resetCode = await prisma.passwordResetCode.findFirst({
    where: { user_id: user.id, code, verified_at: null, expires_at: { gt: new Date() } },
    orderBy: { created_at: "desc" },
  });
  if (!resetCode) {
    return { error: "קוד לא תקין או שפג תוקפו" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password_hash: await hashPassword(password) },
    }),
    prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { verified_at: new Date() },
    }),
  ]);

  redirect("/login");
}
