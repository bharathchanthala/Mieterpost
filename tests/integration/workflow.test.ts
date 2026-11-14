import { eq } from "drizzle-orm";
import { InngestTestEngine } from "@inngest/test";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { messages, replies } from "@/db/schema";
import { sendApprovedReply } from "@/inngest/functions";
import { resetDatabase } from "../helpers/fixtures";

let messageId: number;

beforeEach(async () => {
  const { heating } = await resetDatabase();
  messageId = heating.id;
});

function run() {
  const engine = new InngestTestEngine({
    function: sendApprovedReply,
    events: [{ name: "reply/approved", data: { messageId } }],
    // Skip the real sleep so the test does not wait for minutes or days.
    steps: [{ id: "wait-before-follow-up", handler() {} }],
  });
  return engine.execute();
}

async function load() {
  return db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: { reply: true },
  });
}

describe("sendApprovedReply workflow", () => {
  it("does nothing while the reply is still a draft", async () => {
    await db.insert(replies).values({ messageId, body: "Entwurf" });

    const { result } = await run();
    expect(result).toMatchObject({ status: "skipped" });
    expect((await load())?.reply?.sentAt).toBeNull();
  });

  it("sends an approved reply, then flags the follow-up", async () => {
    await db.insert(replies).values({ messageId, body: "Freigegeben", status: "approved" });

    const { result, ctx } = await run();
    expect(result).toEqual({ status: "completed" });
    expect(ctx.step.sleep).toHaveBeenCalledWith("wait-before-follow-up", expect.anything());

    const message = await load();
    expect(message?.reply?.status).toBe("sent");
    expect(message?.reply?.sentAt).toBeInstanceOf(Date);
    expect(message?.followUpAt).toBeInstanceOf(Date);
  });

  it("does not send twice when the same event arrives again", async () => {
    await db.insert(replies).values({ messageId, body: "Freigegeben", status: "approved" });
    await run();
    const firstSentAt = (await load())?.reply?.sentAt;

    const { result } = await run();
    expect(result).toMatchObject({ status: "skipped" });
    expect((await load())?.reply?.sentAt).toEqual(firstSentAt);
  });
});
