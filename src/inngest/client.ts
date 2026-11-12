// The Inngest client: used to send events and to define workflow functions.
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "mieterpost",
  // In development, talk to the local Inngest Dev Server
  // (npx inngest-cli@latest dev) instead of Inngest Cloud.
  isDev: process.env.NODE_ENV !== "production",
});

// Event names in one place, so a typo cannot silently break the workflow.
export const REPLY_APPROVED = "reply/approved";
