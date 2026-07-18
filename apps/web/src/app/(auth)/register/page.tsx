"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">הרשמה</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="full_name"
          placeholder="שם מלא"
          required
          className="rounded border border-gray-300 p-2"
        />
        <input
          name="phone_number"
          placeholder="מספר טלפון (למשל 0501234567)"
          required
          className="rounded border border-gray-300 p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="סיסמה"
          required
          className="rounded border border-gray-300 p-2"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {pending ? "נרשם..." : "הרשמה"}
        </button>
      </form>
      <p className="text-sm">
        כבר יש לך חשבון?{" "}
        <Link href="/login" className="underline">
          התחברות
        </Link>
      </p>
    </main>
  );
}
