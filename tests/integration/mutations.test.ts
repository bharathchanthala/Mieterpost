import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { ReplyError, saveReply } from "@/db/mutations";
import { messages, replies } from "@/db/schema";
import { resetDatabase } from "../helpers/fixtures";

let messageId: number;

beforeEach(async () => {
  const { heating } = await resetDatabase();
  messageId = heating.id;
});

async function addDraft(body = "Entwurf") {
  await db.insert(replies).values({ messageId, body });
}

async function load() {
  return db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: { reply: true },
  });
}

describe("saveReply", () => {
  it("refuses to save when there is no draft yet", async () => {
    await expect(saveReply({ messageId, body: "Text", approve: false })).rejects.toBeInstanceOf(ReplyError);
  });

  it("saves edits and keeps the reply as a draft", async () => {
    await addDraft();
    await saveReply({ messageId, body: "Bearbeiteter Text", approve: false });

    const message = await load();
    expect(message?.reply).toMatchObject({ body: "Bearbeiteter Text", status: "draft" });
    expect(message?.status).toBe("new");
  });

  it("approving locks the reply and marks the message as answered", async () => {
    await addDraft();
    await saveReply({ messageId, body: "Finaler Text", approve: true });

    const message = await load();
    expect(message?.reply).toMatchObject({ body: "Finaler Text", status: "approved" });
    expect(message?.status).toBe("answered");
  });

  it("refuses edits after approval", async () => {
    await addDraft();
    await saveReply({ messageId, body: "Finaler Text", approve: true });

    await expect(saveReply({ messageId, body: "Später geändert", approve: false })).rejects.toBeInstanceOf(ReplyError);
    expect((await load())?.reply?.body).toBe("Finaler Text");
  });

  it("lets only one of several simultaneous approvals win (row lock)", async () => {
    // Five clicks at once, repeated three times. Without the row lock in
    // saveReply, more than one click usually "wins" (checked by removing it).
    for (let round = 0; round < 3; round++) {
      const { heating } = await resetDatabase();
      messageId = heating.id;
      await addDraft();

      const results = await Promise.allSettled(
        Array.from({ length: 5 }, (_, click) =>
          saveReply({ messageId, body: `Klick ${click}`, approve: true }),
        ),
      );

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(4);
      for (const r of rejected) expect(r.reason).toBeInstanceOf(ReplyError);
    }
  });
});
