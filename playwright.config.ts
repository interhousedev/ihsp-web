import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end suite (task I3). It drives the real apps against the real backend:
 *
 *   backend/scripts/dev.sh all      # + worker, scheduler, bot (fake modes); `python -m app seed-demo` once
 *   cd web && bunx playwright test  # starts the seven `bun run dev` servers itself (or reuses running ones)
 *
 * Environment:
 *   E2E_RETRIES       retries of a failed test (default 1)
 *   E2E_WORKERS       parallel workers (default 1: the admin login needs the OTP from the shared Mailpit inbox)
 *   E2E_TEACHER_LOGIN login of the demo teacher of Mathematics and Physics (default usmonov.bobur)
 *   E2E_STACK=local   test the docker "local full stack" at http://*.localhost instead of the dev servers
 *   E2E_APPS          comma list of apps whose dev server is started (default: all seven)
 *   E2E_NO_WEBSERVER  =1 never start dev servers (they are already running)
 *   E2E_<APP>_URL, E2E_API_URL, E2E_MAILPIT_URL, E2E_REDIS_URL  see e2e/fixtures/env.ts
 */

const SERVERS = [
  { app: "id", port: 3001, path: "/env.js" },
  { app: "sp", port: 3002, path: "/env.js" },
  { app: "staff", port: 3003, path: "/env.js" },
  { app: "admin", port: 3004, path: "/env.js" },
  { app: "lms", port: 3005, path: "/env.js" },
  { app: "library", port: 3008, path: "/env.js" },
  { app: "share", port: 3006, path: "/ai/env.js" },
] as const

/** `E2E_APPS=id,sp` starts only these dev servers (memory); default: all seven. */
const wanted = process.env.E2E_APPS?.split(",").map((app) => app.trim())
const servers = wanted ? SERVERS.filter(({ app }) => wanted.includes(app)) : SERVERS

const useDevServers = process.env.E2E_STACK !== "local" && process.env.E2E_NO_WEBSERVER !== "1"

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "./e2e/.results",
  globalSetup: "./e2e/support/global-setup.ts",
  // Next.js compiles every route on its first request in dev; the first visit of a page is slow.
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: Number(process.env.E2E_WORKERS ?? 1),
  // The dev servers compile routes on demand and the host is often busy: one retry absorbs a slow first visit.
  retries: Number(process.env.E2E_RETRIES ?? 1),
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "e2e/.report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "e2e/.report" }]],
  use: {
    locale: "en-US",
    timezoneId: "Asia/Tashkent",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    // Next dev overlays and service workers are not wanted in assertions.
    serviceWorkers: "block",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: useDevServers
    ? servers.map(({ app, port, path }) => ({
        command: "bun run dev",
        cwd: `./apps/${app}`,
        url: `http://localhost:${port}${path}`,
        reuseExistingServer: true,
        timeout: 180_000,
        stdout: "ignore" as const,
        stderr: "pipe" as const,
      }))
    : undefined,
})
