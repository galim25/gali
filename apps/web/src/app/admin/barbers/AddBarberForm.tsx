"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addBarberAction } from "@/lib/actions/barbers";

export function AddBarberForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await addBarberAction(fullName);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFullName("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border-barber-teal bg-white flex flex-col gap-3 rounded-xl border p-4">
      <h2 className="text-ink font-bold">הוספת ספר</h2>
      <label className="flex flex-col gap-1 text-sm text-slate-muted">
        שם הספר
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border-barber-teal bg-white text-ink rounded-xl border p-2"
          required
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-barber-teal text-cream-text rounded-full p-2 font-bold disabled:opacity-50"
      >
        {pending ? "מוסיף..." : "הוספת ספר"}
      </button>
    </form>
  );
}
