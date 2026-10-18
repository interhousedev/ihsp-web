/** Error tracking (Bugsink): started only when a DSN is configured, and scrubbed of user data before sending. */
import { describe, expect, test } from "bun:test"
import type { ErrorEvent } from "@sentry/browser"
import { initErrorTracking, scrubBreadcrumb, scrubEvent } from "./error-tracking"

const DSN = "https://public-key@bugsink.example.test/1"

describe("error tracking", () => {
  test("does not start the client when no DSN is configured", () => {
    const calls: unknown[] = []

    expect(initErrorTracking(undefined, (options) => calls.push(options))).toBe(false)
    expect(initErrorTracking("", (options) => calls.push(options))).toBe(false)
    expect(calls).toHaveLength(0)
  })

  test("starts the client with the DSN and the privacy options when a DSN is set", () => {
    const calls: Record<string, unknown>[] = []

    expect(initErrorTracking(DSN, (options) => calls.push({ ...options }))).toBe(true)

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ dsn: DSN, sendDefaultPii: false, tracesSampleRate: 0 })
  })

  test("scrubEvent removes cookies, headers and the user from an event", () => {
    const event = scrubEvent({
      type: undefined,
      request: { url: "https://admin.example.test/logs/", cookies: { session: "x" }, headers: { cookie: "x" } },
      user: { id: "1", ip_address: "10.0.0.1" },
    } as ErrorEvent)

    expect(event.request?.cookies).toBeUndefined()
    expect(event.request?.headers).toBeUndefined()
    expect(event.request?.url).toBe("https://admin.example.test/logs/")
    expect(event.user).toBeUndefined()
  })

  test("scrubBreadcrumb drops UI breadcrumbs that could carry typed input", () => {
    expect(scrubBreadcrumb({ category: "ui.input", message: "secret" })).toBeNull()
    expect(scrubBreadcrumb({ category: "navigation", message: "/logs/" })).not.toBeNull()
  })
})
