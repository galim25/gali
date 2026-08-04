import { NextRequest, NextResponse } from "next/server";
import { verifyTwilioSignature } from "@/lib/ivr/verifySignature";
import { startCall } from "@/lib/ivr/flow";

/** Entry webhook for an incoming call to TWILIO_PHONE_NUMBER — see docs/# IVR BarberBook.txt §5. Public by design (not under proxy.ts's matcher); the X-Twilio-Signature check below is what stands in for auth here. */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params = Object.fromEntries(formData.entries()) as Record<string, string>;

  const signature = req.headers.get("x-twilio-signature");
  if (!verifyTwilioSignature("/api/ivr/voice", params, signature)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return startCall(params.CallSid, params.From ?? null);
}
