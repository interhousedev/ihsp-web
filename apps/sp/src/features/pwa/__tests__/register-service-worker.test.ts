/** Registering the worker: only in production, with the API origin in the address, never throwing. */
import { describe, expect, mock, test } from "bun:test"
import { registerServiceWorker, serviceWorkerUrl } from "../utils/register-service-worker"

describe("serviceWorkerUrl", () => {
  test("carries the API and portal origins in the query", () => {
    expect(serviceWorkerUrl("https://api.ihsu.uz", "https://my.ihsu.uz")).toBe(
      "/sw.js?api=https%3A%2F%2Fapi.ihsu.uz&sp=https%3A%2F%2Fmy.ihsu.uz",
    )
  })
})

describe("registerServiceWorker", () => {
  const registration = { scope: "/" } as ServiceWorkerRegistration

  test("registers the worker for the whole app, never from the HTTP cache", async () => {
    const register = mock(async () => registration)

    const result = await registerServiceWorker({
      apiUrl: "https://api.ihsu.uz",
      portalUrl: "https://my.ihsu.uz",
      container: { register },
      production: true,
    })

    expect(result).toBe(registration)
    expect(register).toHaveBeenCalledWith("/sw.js?api=https%3A%2F%2Fapi.ihsu.uz&sp=https%3A%2F%2Fmy.ihsu.uz", {
      scope: "/",
      updateViaCache: "none",
    })
  })

  test("does nothing in development: unhashed files would be frozen by a cache-first worker", async () => {
    const register = mock(async () => registration)

    expect(
      await registerServiceWorker({
        apiUrl: "http://localhost:8000",
        portalUrl: "http://localhost:3002",
        container: { register },
        production: false,
      }),
    ).toBeNull()
    expect(register).not.toHaveBeenCalled()
  })

  test("does nothing in a browser without service workers", async () => {
    expect(
      await registerServiceWorker({
        apiUrl: "http://localhost:8000",
        portalUrl: "http://localhost:3002",
        container: undefined,
        production: true,
      }),
    ).toBeNull()
  })

  test("a failed registration is only a missing feature", async () => {
    const register = mock(async () => {
      throw new Error("SecurityError")
    })

    expect(
      await registerServiceWorker({
        apiUrl: "https://api.ihsu.uz",
        portalUrl: "https://my.ihsu.uz",
        container: { register },
        production: true,
      }),
    ).toBeNull()
  })
})
