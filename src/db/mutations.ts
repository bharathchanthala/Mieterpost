// All database writes the UI triggers live here, next to queries.ts (reads).
import { eq } from "drizzle-orm";
import { db } from "./index";
import { messages, replies } from "./schema";

// Thrown for problems the user can understand and fix, so the UI can show
// the message. Any other error is treated as unexpected.
export class ReplyError extends Error {}

// Save the landlord's edits to a draft. With approve = true the reply is
// also locked and the message is marked as answered.
export async function saveReply({
  messageId,
  body,
  approve,
}: {
  messageId: number;
  body: string;
  approve: boolean;
}) {
  await db.transaction(async (tx) => {
    // "for update" locks the row until the transaction ends, so two clicks
    // at the same moment cannot both approve or overwrite each other.
    const [reply] = await tx
      .select()
      .from(replies)
      .where(eq(replies.messageId, messageId))
      .for("update");

    if (!reply) throw new ReplyError("There is no draft for this message yet.");
    if (reply.status !== "draft") {
      throw new ReplyError("This reply was already approved and is locked.");
    }

    await tx
      .update(replies)
      .set({
        body,
        status: approve ? "approved" : "draft",
        updatedAt: new Date(),
      })
      .where(eq(replies.id, reply.id));

    if (approve) {
      await tx
        .update(messages)
        .set({ status: "answered" })
        .where(eq(messages.id, messageId));
    }
  });
}
