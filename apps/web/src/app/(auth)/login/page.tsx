"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Heebo } from "next/font/google";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import { BrandHero } from "@/components/BrandHero";
import { BsdBar } from "@/components/BsdBar";

const initialState: ActionState = {};

// Maven Pro (מבוקש בפיגמה) אין לו glyphs בעברית — Heebo נבחר כתחליף הכי קרוב לו
// ויזואלית מתוך Google Fonts שכן תומך בעברית. מוגבל לדף הזה בכוונה (2026-07-24).
const heebo = Heebo({ subsets: ["hebrew", "latin"], weight: ["400", "500", "600", "700"] });

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main
      dir="rtl"
      className={`${heebo.className} bg-cream mx-auto flex min-h-screen max-w-sm flex-col p-6`}
    >
      <BsdBar />
      <BrandHero />
      <h1 className="text-barber-teal mt-6 mb-12 text-center text-[40px] font-semibold">התחברות</h1>
      <form action={formAction} className="flex flex-col">
        <label className="border-barber-teal focus-within:ring-barber-teal flex h-[55px] items-center gap-2 rounded-xl border bg-white px-4 focus-within:ring-2">
          <PhoneIcon />
          <input
            name="phone_number"
            placeholder="מספר טלפון"
            required
            className="text-ink placeholder-slate-muted w-full bg-transparent outline-none"
          />
        </label>
        <label className="border-barber-teal focus-within:ring-barber-teal mt-[35px] flex h-[55px] items-center gap-2 rounded-xl border bg-white px-4 focus-within:ring-2">
          <LockIcon />
          <input
            name="password"
            type="password"
            placeholder="סיסמה"
            required
            className="text-ink placeholder-slate-muted w-full bg-transparent outline-none"
          />
        </label>
        <Link href="/forgot-password" className="text-barber-teal mt-[10px] self-start text-sm font-semibold">
          שכחתי סיסמה?
        </Link>
        {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="bg-barber-teal text-cream-text mt-[35px] h-[55px] rounded-xl text-xl font-semibold tracking-wide uppercase disabled:opacity-50"
        >
          {pending ? "מתחבר..." : "התחברות"}
        </button>
      </form>
      <p className="text-slate-muted mt-6 text-center text-sm">
        אין לך חשבון?{" "}
        <Link href="/register" className="text-barber-teal font-medium">
          הרשמה.
        </Link>
      </p>
    </main>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-barber-teal shrink-0">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-barber-teal shrink-0">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
