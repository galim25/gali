"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);
  const [phone, setPhone] = useState("");

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">שכחתי סיסמה</h1>
      {state.success ? (
        <div className="flex flex-col gap-3">
          <p>נשלח קוד אימות ל-SMS (אם המספר רשום במערכת).</p>
          <Link
            href={`/reset-password?phone=${encodeURIComponent(phone)}`}
            className="rounded bg-black p-2 text-center text-white"
          >
            יש לי קוד — להמשיך
          </Link>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <input
            name="phone_number"
            placeholder="מספר טלפון"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded border border-gray-300 p-2"
          />
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-black p-2 text-white disabled:opacity-50"
          >
            {pending ? "שולח..." : "שליחת קוד"}
          </button>
        </form>
      )}
    </main>
  );
}
