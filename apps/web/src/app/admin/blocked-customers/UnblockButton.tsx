"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unblockPhoneNumberAction } from "@/lib/actions/blocklist";

export function UnblockButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function unblock() {
    setPending(true);
    await unblockPhoneNumberAction(id);
    setPending(false);
    router.refresh();
  }

  return (
    <button onClick={unblock} disabled={pending} className="text-sm text-red-600 underline disabled:opacity-50">
      {pending ? "מסיר..." : "הסרת חסימה"}
    </button>
  );
}
