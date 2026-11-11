// All database questions the UI asks live here, so pages stay short and
// every query can be found (and later tested) in one place.
import { connection } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { messages, properties, tenants, units } from "./schema";

// Every message, newest first, with its tenant -> unit -> property.
export async function getInbox() {
  // Wait for a real request so this is not executed while building.
  await connection();
  return db.query.messages.findMany({
    orderBy: desc(messages.receivedAt),
    with: { tenant: { with: { unit: { with: { property: true } } } } },
  });
}

// One message by id, or undefined when it does not exist.
export async function getMessage(id: number) {
  await connection();
  return db.query.messages.findFirst({
    where: eq(messages.id, id),
    with: {
      tenant: { with: { unit: { with: { property: true } } } },
      reply: true,
    },
  });
}

// All tenants with the flat and building they live in.
export async function getTenants() {
  await connection();
  return db.query.tenants.findMany({
    orderBy: [asc(tenants.lastName), asc(tenants.firstName)],
    with: { unit: { with: { property: true } } },
  });
}

// All properties with their flats and the tenants in each flat.
export async function getProperties() {
  await connection();
  return db.query.properties.findMany({
    orderBy: asc(properties.name),
    with: {
      units: { orderBy: asc(units.id), with: { tenants: true } },
    },
  });
}

// The element type of getInbox()'s result, inferred from the query itself.
export type InboxMessage = Awaited<ReturnType<typeof getInbox>>[number];
