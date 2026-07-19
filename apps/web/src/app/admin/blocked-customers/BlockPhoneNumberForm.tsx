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
    <form onSubmit={submit} className="border-tropical-teal flex flex-col gap-3 rounded border p-4">
      <h2 className="text-neon-ice font-medium">חסימת מספר טלפון</h2>
      <input
        placeholder="מספר טלפון"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
        required
      />
      <input
        placeholder="סיבה (לא חובה)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="border-tropical-teal bg-space-indigo text-neon-ice placeholder-gray-400 rounded border p-2"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-tropical-teal text-prussian-blue rounded p-2 font-medium disabled:opacity-50"
      >
        {pending ? "חוסם..." : "חסימת מספר"}
      </button>
    </form>
  );
}
