import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    restoreMocks: true,
    // Date formatting is pinned to en-GB; pin the zone too so the
    // assertions do not depend on where the tests run.
    env: { TZ: "UTC" },
  },
});
