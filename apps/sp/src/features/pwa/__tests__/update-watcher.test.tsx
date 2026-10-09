/** Forced updates and the "Update available" toast, driven by `GET /v1/app/version`. */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { Toaster } from "@ihsp/ui"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { configureTests } from "../../../tests/helpers"
import { UpdateWatcher } from "../components/update-watcher"
import { PERSIST_STORAGE_KEY } from "../../offline/utils/persisted-queries"
import { APP_VERSION } from "../utils/app-version"
import { writeForcedReload } from "../utils/update-guard"
import { renderPwa, setRuntimeConfig } from "./pwa-test-support"

configureTests()

/** happy-dom's `location.reload` navigates nowhere; the test only needs to know it was called. */
let reloads = 0
let originalReload: PropertyDescriptor | undefined

beforeEach(() => {
  setRuntimeConfig("pwa")
  reloads = 0
  originalReload = Object.getOwnPropertyDescriptor(window.location, "reload")
  Object.defineProperty(window.location, "reload", {
    configurable: true,
    value: () => {
      reloads += 1
    },
  })
})

afterEach(() => {
  toast.dismiss()
  if (originalReload) Object.defineProperty(window.location, "reload", originalReload)
  else delete (window.location as unknown as Record<string, unknown>).reload
})

function answerVersion(latest: string, minSupported: string) {
  server.use(http.get(apiUrl("/v1/app/version"), () => HttpResponse.json({ latest, min_supported: minSupported })))
}

function renderWatcher() {
  return renderPwa(
    <>
      <Toaster />
      <UpdateWatcher />
    </>,
  )
}

describe("the running build is the default", () => {
  test("the test build is 1.0.0", () => {
    expect(APP_VERSION).toBe("1.0.0")
  })
})

describe("a build below min_supported (forced update)", () => {
  test("covers the app and reloads at once, with the stored answers and cached pages dropped", async () => {
    answerVersion("2.0.0", "1.5.0")
    window.localStorage.setItem(PERSIST_STORAGE_KEY, "stored")

    renderWatcher()

    expect(await screen.findByRole("alert")).toHaveTextContent("Updating IHSP")
    await waitFor(() => expect(reloads).toBe(1))
    expect(window.localStorage.getItem(PERSIST_STORAGE_KEY)).toBeNull()
  })

  test("does not loop: a reload that did not help is followed by the toast, not another reload", async () => {
    answerVersion("2.0.0", "1.5.0")
    writeForcedReload({ target: "1.5.0", at: Date.now() })

    renderWatcher()

    expect(await screen.findByText("Update available")).toBeInTheDocument()
    expect(screen.queryByText("Updating IHSP")).not.toBeInTheDocument()
    expect(reloads).toBe(0)
  })
})

describe("a build below latest (optional update)", () => {
  test("shows the toast with a Reload button, and Reload applies the update", async () => {
    answerVersion("1.1.0", "1.0.0")
    const { user } = renderWatcher()

    expect(await screen.findByText("Update available")).toBeInTheDocument()
    expect(screen.getByText("A new version of IHSP is ready.")).toBeInTheDocument()
    expect(reloads).toBe(0)
    await user.click(screen.getByRole("button", { name: "Reload" }))

    await waitFor(() => expect(reloads).toBe(1))
  })
})

describe("an up-to-date build", () => {
  test("shows nothing and never reloads", async () => {
    answerVersion("1.0.0", "1.0.0")
    const asked = spyOn(window, "fetch")

    renderWatcher()

    await waitFor(() => expect(asked).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByText("Update available")).not.toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(reloads).toBe(0)
  })

  test("a server that cannot be reached (offline) changes nothing", async () => {
    server.use(http.get(apiUrl("/v1/app/version"), () => HttpResponse.error()))
    const asked = spyOn(window, "fetch")

    renderWatcher()

    await waitFor(() => expect(asked).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByText("Update available")).not.toBeInTheDocument()
    expect(reloads).toBe(0)
  })

  test("the request is public and never taken from a cache", async () => {
    answerVersion("1.0.0", "1.0.0")
    const asked = spyOn(globalThis, "fetch")

    renderWatcher()

    await waitFor(() => expect(asked).toHaveBeenCalled())
    const [url, init] = asked.mock.calls[0] as [string, RequestInit]
    expect(url).toEndWith("/v1/app/version")
    expect(init.cache).toBe("no-store")
    expect(new Headers(init.headers).get("authorization")).toBeNull()
  })
})
