/** `getServiceWorkerRegistration()`: how the push helper reaches `registration.pushManager`. */
import { afterEach, describe, expect, test } from "bun:test"
import {
  getServiceWorkerRegistration,
  resetServiceWorkerRegistration,
  trackServiceWorkerRegistration,
} from "../utils/service-worker-registration"

const registration = { scope: "/", pushManager: {} } as unknown as ServiceWorkerRegistration

function setContainer(container: unknown): void {
  Object.defineProperty(window.navigator, "serviceWorker", { value: container, configurable: true })
}

afterEach(() => {
  resetServiceWorkerRegistration()
  delete (window.navigator as unknown as Record<string, unknown>).serviceWorker
})

describe("getServiceWorkerRegistration", () => {
  test("waits for the registration the app started", async () => {
    trackServiceWorkerRegistration(new Promise((resolve) => setTimeout(() => resolve(registration), 10)))

    expect(await getServiceWorkerRegistration()).toBe(registration)
  })

  test("is null when that registration failed", async () => {
    trackServiceWorkerRegistration(Promise.resolve(null))

    expect(await getServiceWorkerRegistration()).toBeNull()
  })

  test("asks the browser when the app has not registered anything (a worker registered earlier)", async () => {
    setContainer({ getRegistration: async () => registration })

    expect(await getServiceWorkerRegistration()).toBe(registration)
  })

  test("is null in the portal, where there is no worker", async () => {
    setContainer({ getRegistration: async () => undefined })

    expect(await getServiceWorkerRegistration()).toBeNull()
  })

  test("is null in a browser without service workers, and when the browser throws", async () => {
    expect(await getServiceWorkerRegistration()).toBeNull()

    setContainer({
      getRegistration: async () => {
        throw new Error("InvalidStateError")
      },
    })

    expect(await getServiceWorkerRegistration()).toBeNull()
  })
})
