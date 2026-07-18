import { z } from "zod";
import { PHONE_NUMBER_REGEX } from "@barberbook/shared";

export const phoneSchema = z
  .string()
  .trim()
  .regex(PHONE_NUMBER_REGEX, "מספר טלפון לא תקין");

export const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "יש להזין שם מלא"),
  phone_number: phoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  phone_number: phoneSchema,
  password: z.string().min(1, "יש להזין סיסמה"),
});

export const forgotPasswordSchema = z.object({
  phone_number: phoneSchema,
});

export const resetPasswordSchema = z.object({
  phone_number: phoneSchema,
  code: z.string().length(6, "קוד האימות חייב להכיל 6 ספרות"),
  password: passwordSchema,
});
