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
 * Confirmed 2026-08-05 (freeivr.co.il post 76): Yemot defaults to GET (query
 * string); POST (form-encoded body) only happens if the extension is
 * explicitly configured with `api_url_post=yes` in Yemot's admin panel. Both
 * are still handled here defensively since it's not yet confirmed which the
 * purchased line's extension will use in practice — simplify to GET-only
 * once that's set and a real request has been inspected.
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
