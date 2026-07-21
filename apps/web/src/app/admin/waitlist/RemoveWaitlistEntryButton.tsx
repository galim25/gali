"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeWaitlistEntryAction } from "@/lib/actions/waitlist";

export function RemoveWaitlistEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    await removeWaitlistEntryAction(id);
    setPending(false);
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={pending} className="text-sm text-red-400 underline disabled:opacity-50">
      {pending ? "מסיר..." : "הסרה מהרשימה"}
    </button>
  );
}
