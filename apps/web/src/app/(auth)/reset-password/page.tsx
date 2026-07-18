"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">איפוס סיסמה</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="phone_number"
          placeholder="מספר טלפון"
          required
          defaultValue={phone}
          className="rounded border border-gray-300 p-2"
        />
        <input
          name="code"
          placeholder="קוד אימות (6 ספרות)"
          required
          maxLength={6}
          className="rounded border border-gray-300 p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="סיסמה חדשה"
          required
          className="rounded border border-gray-300 p-2"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {pending ? "מעדכן..." : "עדכון סיסמה"}
        </button>
      </form>
    </main>
  );
}
