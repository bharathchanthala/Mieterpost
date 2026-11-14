import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { isValidSessionToken } from "@/lib/session";

const ownKey = new TextEncoder().encode(process.env.SESSION_SECRET);
const otherKey = new TextEncoder().encode("a-different-secret-that-is-also-32-chars-long");

function sign(key: Uint8Array, expiresAt: string | number = "1h") {
  return new SignJWT({ role: "landlord" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key);
}

describe("isValidSessionToken", () => {
  it("accepts a token signed with the app's secret", async () => {
    expect(await isValidSessionToken(await sign(ownKey))).toBe(true);
  });

  it("rejects a token signed with another secret (a forgery)", async () => {
    expect(await isValidSessionToken(await sign(otherKey))).toBe(false);
  });

  it("rejects an expired token", async () => {
    const expired = await sign(ownKey, Math.floor(Date.now() / 1000) - 60);
    expect(await isValidSessionToken(expired)).toBe(false);
  });

  it("rejects missing and malformed tokens", async () => {
    expect(await isValidSessionToken(undefined)).toBe(false);
    expect(await isValidSessionToken("")).toBe(false);
    expect(await isValidSessionToken("not.a.token")).toBe(false);
  });
});
