// Creates or updates the tables in the test database: npm run test:db:setup
// Runs "drizzle-kit push" with DATABASE_URL pointing at the test database.
// Written as a script so it works the same on Windows, macOS, Linux and CI.
import { spawnSync } from "node:child_process";
import { getTestDatabaseUrl } from "./helpers/test-database-url";

const url = getTestDatabaseUrl();
const result = spawnSync("npx drizzle-kit push --force", {
  shell: true,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
process.exit(result.status ?? 1);
