// Durable workflows. Each step.run() result is saved by Inngest. If the server
// crashes or a step fails, the function resumes from the last finished step
// instead of starting over, and failed steps are retried automatically.
import { and, eq } from "drizzle-orm";
import { NonRetriableError } from "inngest";
import { z } from "zod";
import { db } from "@/db";
import { messages, replies } from "@/db/schema";
import { inngest, REPLY_APPROVED } from "./client";

// How long to wait before reminding the landlord. Use e.g. "30s" in
// .env.local to watch the whole workflow finish during a demo.
const followUpDelay = process.env.FOLLOW_UP_DELAY ?? "3d";

const eventDataSchema = z.object({ messageId: z.number().int().positive() });

export const sendApprovedReply = inngest.createFunction(
  {
    id: "send-approved-reply",
    triggers: [{ event: REPLY_APPROVED }],
    retries: 3,
  },
  async ({ event, step }) => {
    // Events can come from anywhere (our app, the Inngest dashboard's
    // "Invoke" button, a bug), so the data is checked before it is used.
    const parsed = eventDataSchema.safeParse(event.data);
    if (!parsed.success) {
      // Retrying cannot fix bad input, so tell Inngest not to retry.
      throw new NonRetriableError(
        'This workflow needs event data like { "messageId": 1 }. It is normally started by approving a reply in the app.',
      );
    }
    const { messageId } = parsed.data;

    // Step 1: "send" the reply and mark it as sent.
    const sent = await step.run("send-reply", async () => {
      const reply = await db.query.replies.findFirst({
        where: eq(replies.messageId, messageId),
        with: { message: { with: { tenant: true } } },
      });
      if (!reply) return { sent: false, reason: "reply not found" };

      // Idempotency: if this event arrives twice, the second run sees that
      // the reply is no longer "approved" and does nothing.
      if (reply.status !== "approved") {
        return { sent: false, reason: `status is ${reply.status}` };
      }

      // TODO: replace with a real email provider (e.g. Resend). For now the
      // email is only simulated, so no real message leaves the app.
      console.log(
        `[simulated email] To: ${reply.message.tenant.email} | Re: ${reply.message.subject}`,
      );

      // The status check in the WHERE clause makes the update itself safe
      // even if two runs reach this line at the same moment.
      await db
        .update(replies)
        .set({ status: "sent", sentAt: new Date() })
        .where(and(eq(replies.id, reply.id), eq(replies.status, "approved")));

      return { sent: true, reason: null };
    });

    if (!sent.sent) return { status: "skipped", reason: sent.reason };

    // Step 2: pause. The function is not running or costing anything while it
    // sleeps; Inngest wakes it up again, even days later or after a redeploy.
    await step.sleep("wait-before-follow-up", followUpDelay);

    // Step 3: flag the message so the landlord checks back with the tenant.
    await step.run("flag-follow-up", async () => {
      await db
        .update(messages)
        .set({ followUpAt: new Date() })
        .where(eq(messages.id, messageId));
    });

    return { status: "completed" };
  },
);

// Every function must be listed here to be served to Inngest.
export const functions = [sendApprovedReply];
