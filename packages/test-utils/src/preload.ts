/**
 * `bun test` preload (see `bunfig.toml`): browser globals (happy-dom), Testing Library matchers, the MSW server and a
 * mocked `next/navigation`. Order matters: happy-dom first, then everything that reads `window` / `document`.
 */
import { afterAll, afterEach, beforeAll, expect, mock } from "bun:test"
import { GlobalRegistrator } from "@happy-dom/global-registrator"

GlobalRegistrator.register({ url: "http://localhost:3000/", width: 1280, height: 800 })

const { default: _default, ...matchers } = await import("@testing-library/jest-dom/matchers")
expect.extend(matchers)

const { cleanup } = await import("@testing-library/react")
const { createApiClient, setApiClient } = await import("@ihsp/api")
const { resetAuthState } = await import("@ihsp/auth")
const { resetConfig } = await import("@ihsp/config")
const { TEST_ENV } = await import("./fixtures/env")
const { server } = await import("./server")
const { resetCreatedFiles } = await import("./handlers")
const { resetTestRouter, testNavigation } = await import("./router")

// `next/navigation` needs the Next.js app router; tests drive routes with `setTestRoute` and assert on `testRouter`.
mock.module("next/navigation", () => testNavigation)

/** Test files share one process, so the API client and the session must not leak from one test into the next. */
function resetApiAndAuth(): void {
  resetAuthState()
  setApiClient(createApiClient({ getToken: () => null, onRefresh: async () => false, onUnauthorized: () => undefined }))
}

function applyTestEnv(): void {
  window.__ENV__ = { ...TEST_ENV }
  resetConfig()
}

applyTestEnv()

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  cleanup()
  mock.restore() // spies from spyOn; the next/navigation module mock is kept
  server.resetHandlers()
  resetCreatedFiles()
  window.localStorage.clear()
  window.sessionStorage.clear()
  resetTestRouter()
  resetApiAndAuth()
  applyTestEnv()
})

afterAll(() => {
  server.close()
})
