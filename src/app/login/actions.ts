"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error: string | null };

const loginSchema = z.object({ password: z.string().min(1).max(200) });

// Compare two strings without leaking, through timing, how many leading
// characters matched. Hashing first gives both inputs the same length,
// which timingSafeEqual requires.
function safeEqual(a: string, b: string) {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return { error: "Login is not configured. Set APP_PASSWORD in .env.local." };
  }

  const parsed = loginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success || !safeEqual(parsed.data.password, expected)) {
    // Slow down guessing a little. A real product would add rate limiting.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { error: "Wrong password." };
  }

  await createSession();
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
