import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/account");
  const isAuthRoute = ["/login", "/register"].includes(pathname);

  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && session && session.role !== "administrator") {
    // A logged-in non-admin hitting /admin must not be redirected to
    // /login: the auth-route rule below would immediately bounce an
    // authenticated session back out again, causing a redirect loop.
    return NextResponse.redirect(new URL("/account", request.url));
  }

  if (isAccountRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(
      new URL(session.role === "administrator" ? "/admin" : "/account", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/register"],
};
