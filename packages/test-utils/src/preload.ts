/**
 * `bun test` preload (see `bunfig.toml`): browser globals (happy-dom), Testing Library matchers, the MSW server and a
 * mocked `next/navigation`. Order matters: happy-dom first, then everything that reads `window` / `document`.
 */
import { afterAll, afterEach, beforeAll, expect, mock } from "bun:test"
import { GlobalRegistrator } from "@happy-dom/global-registrator"

GlobalRegistrator.register({ url: "http://localhost:3000/", width: 1280, height: 800 })

/**
 * Pages are served with `<!DOCTYPE html>` (standards mode), but happy-dom has no `document.compatMode`, and KaTeX
 * refuses to render outside standards mode. It checks once when it is imported, so this comes before any import.
 */
Object.defineProperty(document, "compatMode", { configurable: true, value: "CSS1Compat" })

/**
 * A failed `expect(element)` makes Bun print the element, and a happy-dom node links to the whole window (listeners,
 * caches, every other node). That is tens of MB and many seconds per failure, which inside `waitFor` stalls the event
 * loop for good and fails every test after it. Print a node as its short HTML instead.
 */
Object.defineProperty(Node.prototype, Symbol.for("nodejs.util.inspect.custom"), {
  configurable: true,
  writable: true,
  value(this: Node): string {
    if (this.nodeType !== Node.ELEMENT_NODE) return `[${this.nodeName}]`
    const html = (this as Element).outerHTML
    return html.length > 300 ? `${html.slice(0, 300)}…` : html
  },
})

const { default: _default, ...matchers } = await import("@testing-library/jest-dom/matchers")
expect.extend(matchers)

const { cleanup } = await import("@testing-library/react")
const { createApiClient, setApiClient } = await import("@ihsp/api")
const { resetAuthState } = await import("@ihsp/auth")
const { resetConfig } = await import("@ihsp/config")
const { TEST_ENV } = await import("./fixtures/env")
const { server } = await import("./server")
const {
  resetAssessments,
  resetCreatedFiles,
  resetLibraryState,
  resetNotebooksState,
  resetSubjectMaterialsState,
  resetTeacherContacts,
  resetTeacherPhotos,
  resetAdminAiState,
  resetWebSearchState,
} = await import("./handlers")
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
  resetNotebooksState()
  resetWebSearchState()
  resetAdminAiState()
  resetLibraryState()
  resetSubjectMaterialsState()
  resetTeacherContacts()
  resetTeacherPhotos()
  resetAssessments()
  window.localStorage.clear()
  window.sessionStorage.clear()
  resetTestRouter()
  resetApiAndAuth()
  applyTestEnv()
})

afterAll(() => {
  server.close()
})
