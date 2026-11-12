"use server";

// Server Actions: functions the browser can call, but that run on the server.
// The API key and database stay server-side; the browser only gets the result.
import { APICallError, RetryError } from "ai";
import { refresh } from "next/cache";
import { z } from "zod";
import { processMessage } from "@/ai/agent";
import { ReplyError, saveReply } from "@/db/mutations";
import { inngest, REPLY_APPROVED } from "@/inngest/client";
import { hasSession } from "@/lib/session";

export type ActionState = { error: string | null };

const messageIdSchema = z.number().int().positive();

const NOT_SIGNED_IN: ActionState = {
  error: "Your session has expired. Reload the page and sign in again.",
};

export async function generateDraft(messageId: number): Promise<ActionState> {
  // A server action is a public HTTP endpoint. Anyone can call it directly,
  // so it checks the session itself instead of trusting the page or proxy.
  if (!(await hasSession())) return NOT_SIGNED_IN;
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
    return { error: describeAiError(error) };
  }

  // Reload the page data so the new draft and badges appear.
  refresh();
  return { error: null };
}

// Turn an LLM failure into a message that says what to do about it.
function describeAiError(error: unknown): string {
  // After its automatic retries the AI SDK wraps the last failure.
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  if (APICallError.isInstance(cause)) {
    if (cause.statusCode === 503 || cause.statusCode === 529) {
      return "The AI model is overloaded right now. This is on the provider's side: wait a minute and try again, or set a different model with AI_MODEL in .env.local.";
    }
    if (cause.statusCode === 429) {
      return "The AI provider's usage limit was reached. Free tiers allow only a small number of requests per day: try again later, or set a different model with AI_MODEL in .env.local.";
    }
    if (cause.statusCode === 401 || cause.statusCode === 403) {
      return "The AI provider rejected the API key. Check GOOGLE_GENERATIVE_AI_API_KEY in .env.local.";
    }
    if (cause.statusCode === 404) {
      return "The AI model was not found. Check the model name (AI_MODEL) in .env.local.";
    }
  }
  return "The draft could not be generated. Check the terminal for details, then try again.";
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
  if (!(await hasSession())) return NOT_SIGNED_IN;
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

  // Approval is saved. Now hand the slow work (sending, follow-up) to the
  // background workflow, so this request can return immediately.
  if (parsed.data.intent === "approve") {
    const started = await startSendWorkflow(messageId);
    refresh();
    return started;
  }

  refresh();
  return { error: null };
}

// Tell Inngest that a reply was approved. Also used by the "Retry sending"
// button when the workflow could not be started the first time.
async function startSendWorkflow(messageId: number): Promise<ActionState> {
  try {
    await inngest.send({
      // A fixed id per message: if the same event is sent twice within a
      // day, Inngest ignores the duplicate.
      id: `reply-approved-${messageId}`,
      name: REPLY_APPROVED,
      data: { messageId },
    });
    return { error: null };
  } catch (error) {
    console.error("Could not start the send workflow:", error);
    return {
      error:
        "The reply is approved, but sending could not be started. Is the Inngest dev server running? Start it and click Retry sending.",
    };
  }
}

export async function retrySending(messageId: number): Promise<ActionState> {
  if (!(await hasSession())) return NOT_SIGNED_IN;
  if (!messageIdSchema.safeParse(messageId).success) {
    return { error: "Invalid message." };
  }
  // No id here on purpose: a retry must not be dropped as a duplicate. The
  // workflow itself checks the reply status, so it still cannot send twice.
  try {
    await inngest.send({ name: REPLY_APPROVED, data: { messageId } });
  } catch (error) {
    console.error("Could not start the send workflow:", error);
    return {
      error:
        "Sending could not be started. Is the Inngest dev server running?",
    };
  }
  refresh();
  return { error: null };
}
