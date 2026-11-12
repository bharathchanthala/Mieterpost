// The HTTP endpoint Inngest calls to discover and run our workflow functions.
// A route.ts file is an API endpoint instead of a page: this one is /api/inngest.
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({ client: inngest, functions });
