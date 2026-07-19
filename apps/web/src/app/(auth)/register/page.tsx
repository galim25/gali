"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import { PageHeader } from "@/components/PageHeader";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-sm flex-col gap-4 p-6">
      <PageHeader title="הרשמה" />
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="full_name"
          placeholder="שם מלא"
          required
          className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        />
        <input
          name="phone_number"
          placeholder="מספר טלפון (למשל 0501234567)"
          required
          className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="סיסמה"
          required
          className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        />
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium disabled:opacity-50"
        >
          {pending ? "נרשם..." : "הרשמה"}
        </button>
      </form>
      <p className="text-neon-ice text-sm">
        כבר יש לך חשבון?{" "}
        <Link href="/login" className="underline">
          התחברות
        </Link>
      </p>
    </main>
  );
}
