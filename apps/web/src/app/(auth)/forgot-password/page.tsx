"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPasswordAction, type ActionState } from "@/lib/actions/auth";
import { BrandHero } from "@/components/BrandHero";
import { BsdBar } from "@/components/BsdBar";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);
  const [phone, setPhone] = useState("");

  return (
    <main dir="rtl" className="bg-cream mx-auto flex min-h-screen max-w-sm flex-col p-6">
      <BsdBar />
      <BrandHero />
      <div className="mt-6 mb-8 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="חזרה" className="text-barber-teal">
          <BackIcon />
        </button>
        <h1 className="text-barber-teal flex-1 text-center text-xl font-bold">שכחתי סיסמה</h1>
        <div className="w-[22px]" aria-hidden="true" />
      </div>

      {state.success ? (
        <div className="flex flex-col gap-5">
          <p className="text-ink text-lg font-bold">נשלח קוד אימות ב-SMS (אם המספר רשום במערכת).</p>
          <Link
            href={`/reset-password?phone=${encodeURIComponent(phone)}`}
            className="bg-barber-teal text-cream-text rounded-full py-3 text-center text-lg font-bold tracking-wide uppercase"
          >
            יש לי קוד — להמשיך
          </Link>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-5">
          <p className="text-ink text-lg font-bold">
            יש להזין את מספר הטלפון. יישלח קוד לקביעת סיסמה חדשה ב-SMS.
          </p>
          <label className="border-barber-teal focus-within:ring-barber-teal flex items-center gap-2 rounded-xl border bg-white px-4 py-3 focus-within:ring-2">
            <input
              name="phone_number"
              placeholder="מספר טלפון"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-ink placeholder-slate-muted w-full bg-transparent outline-none"
            />
          </label>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="bg-barber-teal text-cream-text rounded-full py-3 text-center text-lg font-bold tracking-wide uppercase disabled:opacity-50"
          >
            {pending ? "שולח..." : "המשך"}
          </button>
        </form>
      )}
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
