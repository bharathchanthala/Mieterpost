import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Same "@/..." imports as the app (see tsconfig.json).
      "@": fromRoot("./src"),
      // "server-only" throws when imported outside Next.js on purpose.
      // Tests run in plain Node, so it is replaced with an empty module.
      "server-only": fromRoot("./tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    projects: [
      {
        // Fast tests: no database, no network, no API key.
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          env: {
            // Never contacted: unit tests do not run queries. The pg
            // library only connects when the first query is sent.
            DATABASE_URL: "postgresql://unit:unit@127.0.0.1:1/unit_never_used",
            SESSION_SECRET: "unit-test-secret-that-is-at-least-32-characters",
          },
        },
      },
      {
        // Slower tests against a real PostgreSQL test database.
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          // All files share one database, so they run one after another in
          // a single process instead of in parallel.
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
        },
      },
    ],
  },
});
