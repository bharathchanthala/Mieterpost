"use server";

// Server Actions: functions the browser can call, but that run on the server.
// The API key and database stay server-side; the browser only gets the result.
import { refresh } from "next/cache";
import { z } from "zod";
import { processMessage } from "@/ai/agent";
import { ReplyError, saveReply } from "@/db/mutations";

export type ActionState = { error: string | null };

const messageIdSchema = z.number().int().positive();

export async function generateDraft(messageId: number): Promise<ActionState> {
  // Never trust input from the browser, even from our own button.
  if (!messageIdSchema.safeParse(messageId).success) {
    return { error: "Invalid message." };
  }

  try {
    await processMessage(messageId);
  } catch (error) {
    if (error instanceof ReplyError) return { error: error.message };
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

// What the reply form is allowed to send. Anything else is rejected.
const replyFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "The reply cannot be empty.")
    .max(5000, "The reply is too long (maximum 5,000 characters)."),
  // Which of the two buttons was pressed.
  intent: z.enum(["save", "approve"]),
});

export async function updateReply(
  messageId: number,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!messageIdSchema.safeParse(messageId).success) {
    return { error: "Invalid message." };
  }

  const parsed = replyFormSchema.safeParse({
    body: formData.get("body"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await saveReply({
      messageId,
      body: parsed.data.body,
      approve: parsed.data.intent === "approve",
    });
  } catch (error) {
    if (error instanceof ReplyError) return { error: error.message };
    console.error("updateReply failed:", error);
    return { error: "The reply could not be saved. Please try again." };
  }

  refresh();
  return { error: null };
}
