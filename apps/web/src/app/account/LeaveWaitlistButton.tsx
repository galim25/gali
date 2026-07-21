"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveWaitlistAction } from "@/lib/actions/waitlist";

export function LeaveWaitlistButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function leave() {
    setPending(true);
    await leaveWaitlistAction();
    setPending(false);
    router.refresh();
  }

  return (
    <button onClick={leave} disabled={pending} className="text-neon-ice text-sm underline disabled:opacity-50">
      {pending ? "מסיר..." : "הסרה מהרשימה"}
    </button>
  );
}
