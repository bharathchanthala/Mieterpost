// Sessions: how the app remembers that someone has logged in.
// After a correct password, the server puts a signed token in a cookie.
// On every later request the server checks that signature.
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 7;

function getKey() {
  const secret = process.env.SESSION_SECRET;
  // A short secret could be guessed, which would let anyone forge a session.
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. Set it in .env.local.",
    );
  }
  return new TextEncoder().encode(secret);
}

// Check a token's signature and expiry. Returns true only for a valid session.
export async function isValidSessionToken(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    return true;
  } catch {
    // Wrong signature, expired, or not a token at all.
    return false;
  }
}

export async function createSession() {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  // The token says only "this is the landlord". No personal data goes in it,
  // because a signed token can still be read by whoever holds it.
  const token = await new SignJWT({ role: "landlord" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript in the browser cannot read it.
    secure: process.env.NODE_ENV === "production", // HTTPS only when deployed.
    sameSite: "lax", // Not sent on requests triggered by other websites.
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function hasSession() {
  const cookieStore = await cookies();
  return isValidSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

// For pages and queries: send visitors without a session to the login page.
export async function requireSession() {
  if (!(await hasSession())) redirect("/login");
}
