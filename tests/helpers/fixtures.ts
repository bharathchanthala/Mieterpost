// Puts the test database into a known state before each test:
// one property, two flats, two tenants, three messages.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, properties, tenants, units } from "@/db/schema";

export async function resetDatabase() {
  // Empty every table and restart the id counters, in one statement.
  await db.execute(
    sql`TRUNCATE TABLE replies, messages, tenants, units, properties RESTART IDENTITY CASCADE`,
  );

  const [property] = await db
    .insert(properties)
    .values({ name: "Testhaus", street: "Teststraße 1", postalCode: "99423", city: "Weimar" })
    .returning();

  const [unitA, unitB] = await db
    .insert(units)
    .values([
      { propertyId: property.id, label: "EG", rooms: "2.0", areaSqm: "50.00", coldRentCents: 50000 },
      { propertyId: property.id, label: "1. OG", rooms: "3.0", areaSqm: "70.00", coldRentCents: 70000 },
    ])
    .returning();

  const [tenantA, tenantB] = await db
    .insert(tenants)
    .values([
      { unitId: unitA.id, firstName: "Anna", lastName: "Test", email: "anna@example.com", phone: "+49 1", moveInDate: "2022-01-01" },
      { unitId: unitB.id, firstName: "Ben", lastName: "Test", email: "ben@example.com", phone: null, moveInDate: "2023-01-01" },
    ])
    .returning();

  const [heating, earlierA, fromB] = await db
    .insert(messages)
    .values([
      { tenantId: tenantA.id, subject: "Heizung kalt", body: "Die Heizung im Wohnzimmer bleibt kalt." },
      { tenantId: tenantA.id, subject: "Frühere Frage", body: "Darf ich ein Fahrrad im Keller abstellen?" },
      { tenantId: tenantB.id, subject: "Nachricht von Ben", body: "Diese Nachricht gehört einem anderen Mieter." },
    ])
    .returning();

  return { tenantA, tenantB, heating, earlierA, fromB };
}
