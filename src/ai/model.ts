// The one place that decides which LLM the app talks to.
import { google } from "@ai-sdk/google";

// Change the model without touching code by setting AI_MODEL in .env.local.
const modelId = process.env.AI_MODEL ?? "gemini-3.5-flash-lite";

export function getModel() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not set. Add your Gemini API key to .env.local.",
    );
  }
  // The AI SDK gives every provider the same interface. To switch to OpenAI
  // or Claude later, only this file changes.
  return google(modelId);
}
