import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret, warnIfUnexpectedDid } from "@/lib/ivr/verifyWebhookSecret";
import { startCall, continueCall } from "@/lib/ivr/flow";
import { getCallState, clearCallState } from "@/lib/ivr/callState";
import { DTMF_FIELD, SPEECH_FIELD } from "@/lib/ivr/yemotResponse";

/**
 * Single webhook for the whole call (§5/§6 of docs/# IVR BarberBook.txt) —
 * unlike Twilio's voice+gather pair, Yemot's extension always calls back the
 * same api_link for every step; we tell "first request" from "next request"
 * by whether ApiCallId already has state (see flow.ts). Public by design (not
 * under proxy.ts's matcher) — the [secret] path segment is what stands in
 * for auth here (§2 decision #17, no signature mechanism exists).
 *
 * ⚠️ UNVERIFIED (docs "סטטוס"): whether Yemot actually sends GET (query
 * string) or POST (form-encoded body, api_url_post=yes) is a config choice
 * made in Yemot's admin panel when the extension is set up — both are
 * handled here defensively until that's confirmed.
 */
async function extractParams(req: NextRequest): Promise<Record<string, string>> {
  const fromQuery = Object.fromEntries(req.nextUrl.searchParams.entries());
  if (req.method === "GET") return fromQuery;

  const bodyText = await req.text();
  const fromBody = bodyText ? Object.fromEntries(new URLSearchParams(bodyText).entries()) : {};
  return { ...fromQuery, ...fromBody };
}

async function handle(req: NextRequest, secret: string | undefined): Promise<NextResponse> {
  if (!verifyWebhookSecret(secret)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const params = await extractParams(req);
  warnIfUnexpectedDid(params.ApiDID ?? null);

  const apiCallId = params.ApiCallId;
  if (!apiCallId) return new NextResponse("Bad Request", { status: 400 });

  if (params.hangup === "yes") {
    clearCallState(apiCallId);
    return new NextResponse("", { status: 200 });
  }

  const existing = getCallState(apiCallId);
  if (!existing) {
    return startCall(apiCallId, params.ApiPhone ?? null);
  }
  return continueCall(apiCallId, params[DTMF_FIELD] ?? "", params[SPEECH_FIELD] ?? "");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  return handle(req, secret);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  return handle(req, secret);
}
