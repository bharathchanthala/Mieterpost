// Fills the database with fictional demo data. Run with: npm run db:seed
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  // Imported here (not at the top) so DATABASE_URL is loaded first.
  const { db, pool } = await import("./index");
  const { messages, properties, tenants, units } = await import("./schema");

  console.log("Clearing existing data...");
  await db.delete(messages);
  await db.delete(tenants);
  await db.delete(units);
  await db.delete(properties);

  console.log("Inserting properties...");
  const [goethe, linden] = await db
    .insert(properties)
    .values([
      {
        name: "Haus Goethestraße",
        street: "Goethestraße 12",
        postalCode: "99423",
        city: "Weimar",
      },
      {
        name: "Lindenhof",
        street: "Lindenallee 4",
        postalCode: "07743",
        city: "Jena",
      },
    ])
    .returning();

  console.log("Inserting units...");
  const [u1, u2, u3, u4] = await db
    .insert(units)
    .values([
      { propertyId: goethe.id, label: "EG rechts", rooms: "2.0", areaSqm: "54.50", coldRentCents: 52000 },
      { propertyId: goethe.id, label: "1. OG links", rooms: "3.0", areaSqm: "78.00", coldRentCents: 74000 },
      { propertyId: linden.id, label: "2. OG", rooms: "2.5", areaSqm: "61.20", coldRentCents: 68000 },
      { propertyId: linden.id, label: "Dachgeschoss", rooms: "1.0", areaSqm: "32.00", coldRentCents: 41000 },
    ])
    .returning();

  console.log("Inserting tenants...");
  const [t1, t2, t3, t4] = await db
    .insert(tenants)
    .values([
      { unitId: u1.id, firstName: "Anna", lastName: "Beispiel", email: "anna.beispiel@example.com", phone: "+49 3643 000001", moveInDate: "2022-04-01" },
      { unitId: u2.id, firstName: "Jonas", lastName: "Muster", email: "jonas.muster@example.com", phone: null, moveInDate: "2019-09-15" },
      { unitId: u3.id, firstName: "Leyla", lastName: "Demo", email: "leyla.demo@example.com", phone: "+49 3641 000002", moveInDate: "2024-01-01" },
      { unitId: u4.id, firstName: "Tom", lastName: "Probe", email: "tom.probe@example.com", phone: null, moveInDate: "2025-10-01" },
    ])
    .returning();

  console.log("Inserting messages...");
  const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);
  await db.insert(messages).values([
    {
      tenantId: t1.id,
      subject: "Heizung im Wohnzimmer wird nicht warm",
      body: "Guten Tag, seit gestern Abend bleibt der Heizkörper im Wohnzimmer kalt, obwohl das Thermostat auf 5 steht. Die anderen Heizkörper funktionieren. Könnten Sie bitte jemanden vorbeischicken? Ich bin werktags ab 16 Uhr zu Hause.",
      receivedAt: hoursAgo(3),
    },
    {
      tenantId: t2.id,
      subject: "Miete für diesen Monat kommt später",
      body: "Hallo, mein Gehalt wird diesen Monat erst am 10. überwiesen. Wäre es in Ordnung, wenn ich die Miete ausnahmsweise bis zum 12. zahle? Vielen Dank für Ihr Verständnis.",
      receivedAt: hoursAgo(20),
    },
    {
      tenantId: t3.id,
      subject: "Frage zur Nebenkostenabrechnung",
      body: "Guten Tag, ich habe die Nebenkostenabrechnung erhalten und verstehe den Posten 'Hausmeisterdienst' nicht. Können Sie mir erklären, wie sich der Betrag zusammensetzt?",
      receivedAt: hoursAgo(26),
    },
    {
      tenantId: t4.id,
      subject: "Wasserhahn in der Küche tropft",
      body: "Hallo, der Wasserhahn in der Küche tropft seit ein paar Tagen ständig. Es ist nicht dringend, aber es wäre schön, wenn das repariert werden könnte.",
      receivedAt: hoursAgo(50),
    },
    {
      tenantId: t1.id,
      subject: "Darf ich eine Katze halten?",
      body: "Guten Tag, ich würde gerne eine Katze aufnehmen. Ist das laut Mietvertrag erlaubt oder brauche ich dafür Ihre Zustimmung?",
      receivedAt: hoursAgo(120),
    },
  ]);

  console.log("Done. Seeded 2 properties, 4 units, 4 tenants, 5 messages.");

  // Close the connections so the script can exit.
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
