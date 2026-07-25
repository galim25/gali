"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";
import { BrandHero } from "@/components/BrandHero";
import { BsdBar } from "@/components/BsdBar";

const initialState: ActionState = {};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-sm flex-col p-6">
      <BsdBar />
      <BrandHero />
      <div className="mt-6 mb-8 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="חזרה" className="text-barber-teal">
          <BackIcon />
        </button>
        <h1 className="text-barber-teal flex-1 text-center text-xl font-bold">קביעת סיסמה חדשה</h1>
        <div className="w-[22px]" aria-hidden="true" />
      </div>
      <p className="text-slate-muted mb-6 text-center">יש להזין את הקוד שקיבלת ב-SMS ולבחור סיסמה חדשה.</p>

      <form action={formAction} className="flex flex-col gap-5">
        <label className="border-barber-teal focus-within:ring-barber-teal flex items-center gap-2 rounded-xl border bg-white px-4 py-3 focus-within:ring-2">
          <input
            name="phone_number"
            placeholder="מספר טלפון"
            required
            defaultValue={phone}
            className="text-ink placeholder-slate-muted w-full bg-transparent outline-none"
          />
        </label>
        <label className="border-barber-teal focus-within:ring-barber-teal flex items-center gap-2 rounded-xl border bg-white px-4 py-3 focus-within:ring-2">
          <input
            name="code"
            placeholder="קוד אימות"
            required
            maxLength={6}
            className="text-ink placeholder-slate-muted w-full bg-transparent text-center text-2xl tracking-[0.5em] outline-none"
          />
        </label>
        <label className="border-barber-teal focus-within:ring-barber-teal flex items-center gap-2 rounded-xl border bg-white px-4 py-3 focus-within:ring-2">
          <input
            name="password"
            type="password"
            placeholder="סיסמה חדשה"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-ink placeholder-slate-muted w-full bg-transparent outline-none"
          />
        </label>
        <div className="flex flex-col gap-1">
          <label className="border-barber-teal focus-within:ring-barber-teal flex items-center gap-2 rounded-xl border bg-white px-4 py-3 focus-within:ring-2">
            <input
              type="password"
              placeholder="אימות סיסמה"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="text-ink placeholder-slate-muted w-full bg-transparent outline-none"
            />
          </label>
          {mismatch && <p className="text-sm text-red-600">הסיסמאות אינן זהות</p>}
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending || mismatch || !password}
          className="bg-barber-teal text-cream-text rounded-full py-3 text-center text-lg font-bold tracking-wide uppercase disabled:opacity-50"
        >
          {pending ? "מעדכן..." : "עדכון סיסמה"}
        </button>
      </form>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
