"use server";

// Server Actions: functions the browser can call, but that run on the server.
// The API key and database stay server-side; the browser only gets the result.
import { refresh } from "next/cache";
import { processMessage } from "@/ai/agent";

export type DraftState = { error: string | null };

export async function generateDraft(messageId: number): Promise<DraftState> {
  // Never trust input from the browser, even from our own button.
  if (!Number.isInteger(messageId) || messageId < 1) {
    return { error: "Invalid message." };
  }

  try {
    await processMessage(messageId);
  } catch (error) {
    // Log the details on the server, show a safe message in the browser.
    console.error("generateDraft failed:", error);
    return {
      error:
        "The draft could not be generated. Check the API key and model name in .env.local, then try again.",
    };
  }

  // Reload the page data so the new draft and badges appear.
  refresh();
  return { error: null };
}
