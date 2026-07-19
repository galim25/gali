"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";
import { PageHeader } from "@/components/PageHeader";

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
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-sm flex-col gap-4 p-6">
      <PageHeader title="איפוס סיסמה" />
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="phone_number"
          placeholder="מספר טלפון"
          required
          defaultValue={phone}
          className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        />
        <input
          name="code"
          placeholder="קוד אימות (6 ספרות)"
          required
          maxLength={6}
          className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="סיסמה חדשה"
          required
          className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        />
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium disabled:opacity-50"
        >
          {pending ? "מעדכן..." : "עדכון סיסמה"}
        </button>
      </form>
    </main>
  );
}
