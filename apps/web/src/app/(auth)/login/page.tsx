"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main dir="rtl" className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">התחברות</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="phone_number"
          placeholder="מספר טלפון"
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
          {pending ? "מתחבר..." : "התחברות"}
        </button>
      </form>
      <div className="flex justify-between text-sm">
        <Link href="/register" className="underline">
          הרשמה
        </Link>
        <Link href="/forgot-password" className="underline">
          שכחתי סיסמה
        </Link>
      </div>
    </main>
  );
}
