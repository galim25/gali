"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import { PageHeader } from "@/components/PageHeader";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main dir="rtl" className="bg-prussian-blue mx-auto flex min-h-screen max-w-sm flex-col gap-4 p-6">
      <PageHeader title="התחברות" />
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="phone_number"
          placeholder="מספר טלפון"
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
          {pending ? "מתחבר..." : "התחברות"}
        </button>
      </form>
      <div className="text-neon-ice flex justify-between text-sm">
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
