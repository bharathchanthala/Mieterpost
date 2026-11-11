// Tools are functions the LLM may ask us to run while it writes a reply.
// The model never touches the database itself: it requests a tool by name,
// our code runs the query, and the result is sent back to the model.
import { tool } from "ai";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { messages, tenants } from "@/db/schema";

// The tools are created per message and locked to that message's tenant.
// The model cannot pass a tenant id, so it can never read another tenant's data.
export function createTenantTools(tenantId: number, currentMessageId: number) {
  return {
    getTenancyDetails: tool({
      description:
        "Look up the tenancy of the tenant who wrote the message: move-in date, the flat (label, rooms, area, base rent) and the building address.",
      inputSchema: z.object({}),
      execute: async () => {
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, tenantId),
          with: { unit: { with: { property: true } } },
        });
        if (!tenant) return { error: "Tenant not found" };

        // Return only what a reply could need. No email or phone number.
        return {
          moveInDate: tenant.moveInDate,
          unit: {
            label: tenant.unit.label,
            rooms: tenant.unit.rooms,
            areaSqm: tenant.unit.areaSqm,
            baseRentEuro: tenant.unit.coldRentCents / 100,
          },
          property: {
            name: tenant.unit.property.name,
            address: `${tenant.unit.property.street}, ${tenant.unit.property.postalCode} ${tenant.unit.property.city}`,
          },
        };
      },
    }),

    getPreviousMessages: tool({
      description:
        "List earlier messages from the same tenant (newest first), to see whether this is a repeated or related issue.",
      inputSchema: z.object({}),
      execute: async () => {
        const previous = await db.query.messages.findMany({
          where: and(
            eq(messages.tenantId, tenantId),
            ne(messages.id, currentMessageId),
          ),
          orderBy: desc(messages.receivedAt),
          limit: 5,
          columns: { subject: true, body: true, receivedAt: true, status: true },
        });
        return { messages: previous };
      },
    }),
  };
}
