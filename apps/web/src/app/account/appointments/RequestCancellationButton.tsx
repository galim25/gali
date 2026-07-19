"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestCancellationAction } from "@/lib/actions/cancellationRequests";

export function RequestCancellationButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function request() {
    if (!window.confirm("לשלוח בקשת ביטול לספר? התור יבוטל רק לאחר שהספר יאשר.")) return;
    setPending(true);
    setError(undefined);
    const result = await requestCancellationAction(appointmentId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <button onClick={request} disabled={pending} className="text-sm text-red-600 underline disabled:opacity-50">
        {pending ? "שולח..." : "בקשת ביטול"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
