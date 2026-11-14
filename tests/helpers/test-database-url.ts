// Reads the test database address and refuses anything that does not look
// like a test database. The integration tests delete all rows, so pointing
// them at the real development or production database would wipe it.
import { config } from "dotenv";

export function getTestDatabaseUrl(): string {
  // Local runs: TEST_DATABASE_URL lives in .env.test.local (ignored by Git).
  // CI: it is set directly as an environment variable.
  config({ path: ".env.test.local", quiet: true });

  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Create .env.test.local with a line like:\n" +
        'TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/mieterpost_test"',
    );
  }

  const databaseName = new URL(url).pathname.replace(/^\//, "");
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to use database "${databaseName}": its name must end with "_test", because the tests delete all data in it.`,
    );
  }
  return url;
}
