"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveBookingRequestAction, rejectBookingRequestAction } from "@/lib/actions/bookingRequests";

export function DecideBookingRequestButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject">();
  const [error, setError] = useState<string>();

  async function decide(action: "approve" | "reject") {
    setPending(action);
    setError(undefined);
    const result = await (action === "approve"
      ? approveBookingRequestAction(requestId)
      : rejectBookingRequestAction(requestId));
    setPending(undefined);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-3">
        <button
          onClick={() => decide("approve")}
          disabled={!!pending}
          className="bg-tropical-teal text-prussian-blue rounded px-3 py-1 text-sm font-medium disabled:opacity-50"
        >
          {pending === "approve" ? "מאשר..." : "אישור תור"}
        </button>
        <button
          onClick={() => decide("reject")}
          disabled={!!pending}
          className="text-neon-ice rounded border border-gray-500 px-3 py-1 text-sm disabled:opacity-50"
        >
          {pending === "reject" ? "דוחה..." : "דחיית תור"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
