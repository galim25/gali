"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ActionState } from "@/lib/actions/auth";
import { PageHeader } from "@/components/PageHeader";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);
  const [phone, setPhone] = useState("");

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-sm flex-col gap-4 p-6">
      <PageHeader title="שכחתי סיסמה" />
      {state.success ? (
        <div className="flex flex-col gap-3">
          <p className="text-neon-ice">נשלח קוד אימות ל-SMS (אם המספר רשום במערכת).</p>
          <Link
            href={`/reset-password?phone=${encodeURIComponent(phone)}`}
            className="bg-tropical-teal text-prussian-blue rounded p-2 text-center font-medium"
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
            className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
          />
          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium disabled:opacity-50"
          >
            {pending ? "שולח..." : "שליחת קוד"}
          </button>
        </form>
      )}
    </main>
  );
}
