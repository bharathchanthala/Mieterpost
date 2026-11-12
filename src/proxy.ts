// The proxy runs before every matching request reaches a page.
// It is the first gate: visitors without a valid session go to /login.
// It is not the only gate. Queries and server actions check the session
// again, because the code closest to the data must never rely on this file.
import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const loggedIn = await isValidSessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!loggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Already logged in: the login page has nothing to offer.
  if (loggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next.js internals, static files, and the
  // Inngest endpoint (Inngest authenticates itself with a signing key).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/inngest).*)"],
};
