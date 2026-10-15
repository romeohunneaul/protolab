import { defineConfig } from "@playwright/test";

// Smoke on the built example: `npm run build:example` first (npm run check does it).
export default defineConfig({
  testDir: "test",
  testMatch: "smoke.spec.ts",
  timeout: 30_000,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: {
    command: "npm --prefix examples/next run start -- -p 3100",
    url: "http://localhost:3100/lab",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
