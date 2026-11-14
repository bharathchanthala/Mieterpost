// A fake language model for tests. It returns prepared answers in order and
// records every request, so tests can check what the app sent to the model.
// No network, no API key, no cost, and the same result on every run.
import { MockLanguageModelV4 } from "ai/test";

// The shape of one model answer, taken from the mock class itself.
type LanguageModelV4GenerateResult = Awaited<
  ReturnType<MockLanguageModelV4["doGenerate"]>
>;

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 10, text: 10, reasoning: undefined },
};

// The model answers with text (also used for structured JSON output).
export function textResult(text: string): LanguageModelV4GenerateResult {
  return {
    content: [{ type: "text", text }],
    finishReason: { unified: "stop", raw: undefined },
    usage,
    warnings: [],
  };
}

// The model asks the app to run one or more tools.
export function toolCallResult(...toolNames: string[]): LanguageModelV4GenerateResult {
  return {
    content: toolNames.map((toolName, index) => ({
      type: "tool-call" as const,
      toolCallId: `call-${index}`,
      toolName,
      input: "{}",
    })),
    finishReason: { unified: "tool-calls", raw: undefined },
    usage,
    warnings: [],
  };
}

export function createMockModel(results: LanguageModelV4GenerateResult[]) {
  let index = 0;
  const model = new MockLanguageModelV4({
    doGenerate: async () => {
      const result = results[index];
      if (!result) {
        throw new Error(`Mock model was called ${index + 1} times, but only ${results.length} answers were prepared.`);
      }
      index += 1;
      return result;
    },
  });
  return model;
}

export const classificationJson = (overrides: Record<string, string> = {}) =>
  JSON.stringify({
    category: "repair",
    urgency: "high",
    summary: "The living room radiator stays cold.",
    ...overrides,
  });
