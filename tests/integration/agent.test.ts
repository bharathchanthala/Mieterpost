import { eq } from "drizzle-orm";
import type { ToolExecutionOptions } from "ai";
import { beforeEach, describe, expect, it } from "vitest";
import { processMessage } from "@/ai/agent";
import { createTenantTools } from "@/ai/tools";
import { db } from "@/db";
import { saveReply } from "@/db/mutations";
import { messages, replies } from "@/db/schema";
import { resetDatabase } from "../helpers/fixtures";
import { classificationJson, createMockModel, textResult, toolCallResult } from "../helpers/mock-model";

let data: Awaited<ReturnType<typeof resetDatabase>>;

beforeEach(async () => {
  data = await resetDatabase();
});

// Answers for one full run: classify, then request both tools, then write.
function fullRunModel(draft: string) {
  return createMockModel([
    textResult(classificationJson()),
    toolCallResult("getTenancyDetails", "getPreviousMessages"),
    textResult(draft),
  ]);
}

describe("processMessage", () => {
  it("saves the classification and the draft", async () => {
    await processMessage(data.heating.id, fullRunModel("Sehr geehrte Frau Test, ..."));

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, data.heating.id),
      with: { reply: true },
    });
    expect(message).toMatchObject({
      status: "drafted",
      category: "repair",
      urgency: "high",
      summary: "The living room radiator stays cold.",
    });
    expect(message?.reply).toMatchObject({ status: "draft", body: "Sehr geehrte Frau Test, ..." });
  });

  it("overwrites the draft when regenerating, without adding a second reply", async () => {
    await processMessage(data.heating.id, fullRunModel("Erster Entwurf"));
    await processMessage(data.heating.id, fullRunModel("Zweiter Entwurf"));

    const rows = await db.select().from(replies).where(eq(replies.messageId, data.heating.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].body).toBe("Zweiter Entwurf");
  });

  it("refuses to regenerate an approved reply, without calling the model", async () => {
    await processMessage(data.heating.id, fullRunModel("Entwurf"));
    await saveReply({ messageId: data.heating.id, body: "Freigegeben", approve: true });

    const model = fullRunModel("Darf nicht gespeichert werden");
    await expect(processMessage(data.heating.id, model)).rejects.toThrow("already approved");
    expect(model.doGenerateCalls).toHaveLength(0);
  });

  it("sends the tool results back to the model before it writes the reply", async () => {
    const model = fullRunModel("Entwurf");
    await processMessage(data.heating.id, model);

    // The third request (writing the reply) contains what the tools returned.
    const writeRequest = JSON.stringify(model.doGenerateCalls[2].prompt);
    expect(writeRequest).toContain("Testhaus");
    expect(writeRequest).toContain("Frühere Frage");
  });
});

describe("tenant tools", () => {
  const options = { toolCallId: "test", messages: [] } as unknown as ToolExecutionOptions<never>;

  it("never return contact details", async () => {
    const tools = createTenantTools(data.tenantA.id, data.heating.id);
    const result = JSON.stringify(await tools.getTenancyDetails.execute!({}, options));

    expect(result).toContain("Testhaus");
    expect(result).not.toContain("anna@example.com");
    expect(result).not.toContain("+49 1");
  });

  it("only see the current tenant's earlier messages", async () => {
    const tools = createTenantTools(data.tenantA.id, data.heating.id);
    const result = JSON.stringify(await tools.getPreviousMessages.execute!({}, options));

    expect(result).toContain("Frühere Frage");
    // Not the message being answered, and nothing from another tenant.
    expect(result).not.toContain("Heizung kalt");
    expect(result).not.toContain("Nachricht von Ben");
  });
});
