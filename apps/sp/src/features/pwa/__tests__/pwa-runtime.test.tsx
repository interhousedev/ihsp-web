/** The background work of the installed app: worker messages, the session bridge and the offline start. */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { useAuthStore } from "@ihsp/auth"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { act, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { configureTests } from "../../../tests/helpers"
import { PERSIST_STORAGE_KEY } from "../../offline/utils/persisted-queries"
import { PwaRuntime } from "../components/pwa-runtime"
import { OFFLINE_SESSION_KEY, OFFLINE_TOKEN, saveOfflineSession } from "../utils/offline-session"
import { SW_EVENT, SW_MESSAGE } from "../utils/sw-messages"
import { renderPwa, setRuntimeConfig } from "./pwa-test-support"

configureTests()

type Listener = (event: MessageEvent) => void

/** A `navigator.serviceWorker` that controls the page and records what the page says to the worker. */
function fakeServiceWorker() {
  const postMessage = mock((_message: unknown) => undefined)
  const listeners = new Set<Listener>()
  const container = {
    controller: { postMessage },
    ready: Promise.resolve({ active: { postMessage } }),
    register: async () => ({}),
    getRegistration: async () => undefined,
    addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
  }
  Object.defineProperty(window.navigator, "serviceWorker", { value: container, configurable: true })
  return { postMessage, send: (data: unknown) => listeners.forEach((listener) => listener({ data } as MessageEvent)) }
}

beforeEach(() => {
  setRuntimeConfig("pwa")
  // PwaRuntime also asks which build is current; these tests are about something else.
  server.use(http.get(apiUrl("/v1/app/version"), () => HttpResponse.json({ latest: "1.0.0", min_supported: "1.0.0" })))
})
afterEach(() => {
  delete (window.navigator as unknown as Record<string, unknown>).serviceWorker
})

describe("PwaRuntime in the portal", () => {
  test("does nothing", async () => {
    setRuntimeConfig("sp")
    const worker = fakeServiceWorker()

    renderPwa(<PwaRuntime />)
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(worker.postMessage).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(OFFLINE_SESSION_KEY)).toBeNull()
  })
})

describe("the worker follows the session", () => {
  test("a signed-in user is told to the worker, which caches API answers per user", async () => {
    const worker = fakeServiceWorker()

    renderPwa(<PwaRuntime />)

    await waitFor(() =>
      expect(worker.postMessage).toHaveBeenCalledWith({ type: SW_MESSAGE.setUser, userId: userMe.id }),
    )
  })

  test("the user is remembered for starting offline", async () => {
    fakeServiceWorker()

    renderPwa(<PwaRuntime />)

    await waitFor(() => expect(window.localStorage.getItem(OFFLINE_SESSION_KEY)).toContain(userMe.id))
  })

  test("signing out drops the worker's answers, the stored query cache and the remembered user", async () => {
    const worker = fakeServiceWorker()
    renderPwa(<PwaRuntime />)
    await waitFor(() => expect(window.localStorage.getItem(OFFLINE_SESSION_KEY)).not.toBeNull())
    window.localStorage.setItem(PERSIST_STORAGE_KEY, "stored answers")

    act(() => useAuthStore.getState().clear())

    expect(worker.postMessage).toHaveBeenCalledWith({ type: SW_MESSAGE.clearUser })
    expect(window.localStorage.getItem(PERSIST_STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem(OFFLINE_SESSION_KEY)).toBeNull()
  })

  test("a fresh answer from the worker invalidates the stored lists, nothing else", async () => {
    const worker = fakeServiceWorker()
    const { queryClient } = renderPwa(<PwaRuntime />)
    queryClient.setQueryData(["me", "today"], { semester: 1 })
    queryClient.setQueryData(["me", "files"], [])

    act(() => worker.send({ type: SW_EVENT.apiUpdated, url: "https://api/v1/me/today" }))

    expect(queryClient.getQueryState(["me", "today"])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(["me", "files"])?.isInvalidated).toBe(false)
  })

  test("messages that are not the worker's are ignored", () => {
    const worker = fakeServiceWorker()
    const { queryClient } = renderPwa(<PwaRuntime />)
    queryClient.setQueryData(["me", "today"], { semester: 1 })

    act(() => worker.send({ type: "something-else" }))

    expect(queryClient.getQueryState(["me", "today"])?.isInvalidated).toBe(false)
  })
})

/** The app opened offline: the first refresh failed, nobody knows the session. */
function startOffline() {
  const view = renderPwa(<PwaRuntime />, { session: null })
  saveOfflineSession(userMe)
  act(() => useAuthStore.setState({ status: "loading", token: null, user: null, networkError: true }))
  return view
}

describe("starting without the network", () => {
  test("the remembered user is signed in with a placeholder token", async () => {
    fakeServiceWorker()

    startOffline()

    await waitFor(() => expect(useAuthStore.getState().status).toBe("authenticated"))
    expect(useAuthStore.getState().user?.id).toBe(userMe.id)
    expect(useAuthStore.getState().token?.access_token).toBe(OFFLINE_TOKEN)
  })

  test("without a remembered user the app shows the offline screen as before", async () => {
    fakeServiceWorker()
    renderPwa(<PwaRuntime />, { session: null })

    act(() => useAuthStore.setState({ status: "loading", token: null, user: null, networkError: true }))
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(useAuthStore.getState().status).toBe("loading")
    expect(useAuthStore.getState().networkError).toBe(true)
  })

  test("when the network comes back the session is refreshed with the cookie", async () => {
    fakeServiceWorker()
    startOffline()
    await waitFor(() => expect(useAuthStore.getState().token?.access_token).toBe(OFFLINE_TOKEN))

    act(() => {
      window.dispatchEvent(new Event("online"))
    })

    await waitFor(() => expect(useAuthStore.getState().token?.access_token).not.toBe(OFFLINE_TOKEN))
    expect(useAuthStore.getState().status).toBe("authenticated")
  })

  test("the placeholder user is not sent to the worker as a new session", async () => {
    const worker = fakeServiceWorker()

    startOffline()
    await waitFor(() => expect(useAuthStore.getState().status).toBe("authenticated"))

    expect(worker.postMessage).not.toHaveBeenCalledWith({ type: SW_MESSAGE.setUser, userId: userMe.id })
  })
})
