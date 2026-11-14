// Runs before each integration test file.
import { afterAll } from "vitest";
import { getTestDatabaseUrl } from "../helpers/test-database-url";

// Point the app's database code at the test database. This happens before
// any test file imports "@/db", which reads DATABASE_URL when first loaded.
process.env.DATABASE_URL = getTestDatabaseUrl();

afterAll(async () => {
  // Close the connections so the test process can exit, and forget the pool
  // (src/db/index.ts keeps it on globalThis outside production).
  const { pool } = await import("@/db");
  await pool.end();
  delete (globalThis as { pool?: unknown }).pool;
});
