"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { blockPhoneNumberAction } from "@/lib/actions/blocklist";

export function BlockPhoneNumberForm() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await blockPhoneNumberAction({ phone_number: phoneNumber, reason });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPhoneNumber("");
    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border-barber-teal bg-white flex flex-col gap-3 rounded-xl border p-4">
      <h2 className="text-ink font-bold">חסימת מספר טלפון</h2>
      <input
        placeholder="מספר טלפון"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="border-barber-teal bg-white text-ink placeholder-slate-muted rounded-xl border p-2"
        required
      />
      <input
        placeholder="סיבה (לא חובה)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="border-barber-teal bg-white text-ink placeholder-slate-muted rounded-xl border p-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-barber-teal text-cream-text rounded-full p-2 font-bold disabled:opacity-50"
      >
        {pending ? "חוסם..." : "חסימת מספר"}
      </button>
    </form>
  );
}
