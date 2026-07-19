import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  signSession,
  verifySessionToken,
  type SessionPayload,
} from "./jwt";

export type { SessionPayload };

/**
 * Defaults to NODE_ENV === "production", but `next start` always sets that
 * regardless of deployment specifics — and a Secure cookie is silently
 * dropped by the browser on a plain-HTTP origin (e.g. testing a production
 * build at http://ip:port before a domain + TLS are set up), which breaks
 * login with no visible error. COOKIE_SECURE lets ops override that default
 * independently of NODE_ENV for exactly that window.
 */
function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true";
  return process.env.NODE_ENV === "production";
}

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Guards admin-only pages (FR-23) — customers and anonymous visitors never see admin content. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "administrator") redirect("/account");
  return session;
}
