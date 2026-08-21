import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BACKEND_PORT = Number(process.env.PLAYWRIGHT_BACKEND_PORT ?? 3200);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "node e2e/support/backend.mjs",
      url: `http://127.0.0.1:${BACKEND_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: { PLAYWRIGHT_BACKEND_PORT: String(BACKEND_PORT) },
    },
    {
      command: `npx next dev --port ${PORT}`,
      // The front page degrades to an empty schedule when the mock backend has
      // no fixture, so it remains the readiness probe as well as a tested page.
      url: `${baseURL}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DJANGO_URL: `http://127.0.0.1:${BACKEND_PORT}/`,
        PLAYWRIGHT_TEST: "1",
      },
    },
  ],
});
