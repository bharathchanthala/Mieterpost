import { InngestTestEngine } from "@inngest/test";
import { describe, expect, it } from "vitest";
import { sendApprovedReply } from "@/inngest/functions";

// Invalid event data is rejected before any database query runs, so this
// needs no database.
describe("sendApprovedReply input validation", () => {
  it.each([{}, { messageId: "abc" }, { messageId: 1.5 }, { messageId: -3 }])(
    "fails without retrying for event data %j",
    async (data) => {
      const engine = new InngestTestEngine({
        function: sendApprovedReply,
        events: [{ name: "reply/approved", data }],
      });

      const { error } = await engine.execute();
      expect(error).toMatchObject({ name: "NonRetriableError" });
    },
  );
});
