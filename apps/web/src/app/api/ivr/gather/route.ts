import { NextRequest, NextResponse } from "next/server";
import { verifyTwilioSignature } from "@/lib/ivr/verifySignature";
import { continueCall } from "@/lib/ivr/flow";

/** Action target of every `<Gather>` for the lifetime of a call — see docs/# IVR BarberBook.txt §5/§6. Public by design; verified via X-Twilio-Signature, not a session. */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params = Object.fromEntries(formData.entries()) as Record<string, string>;

  const signature = req.headers.get("x-twilio-signature");
  if (!verifyTwilioSignature("/api/ivr/gather", params, signature)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return continueCall(params.CallSid, params.Digits ?? "", params.SpeechResult ?? "");
}
