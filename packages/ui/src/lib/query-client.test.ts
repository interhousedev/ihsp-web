/** SP-UX-b1: a 4xx never changes on a retry, so it is not retried; network errors and 5xx get two more attempts. */
import { describe, expect, test } from "bun:test"
import { createQueryClient, shouldRetry } from "./query-client"

describe("shouldRetry", () => {
  test("SP-UX-b1: never retries a 4xx", () => {
    for (const status of [400, 401, 404, 409, 429]) expect(shouldRetry(0, { status })).toBe(false)
  })

  test("SP-UX-b1: retries a 5xx and a network error (status 0) at most twice", () => {
    for (const status of [500, 503, 0]) {
      expect(shouldRetry(0, { status })).toBe(true)
      expect(shouldRetry(1, { status })).toBe(true)
      expect(shouldRetry(2, { status })).toBe(false)
    }
  })

  test("SP-UX-b1: an error without a status counts as a network error", () => {
    expect(shouldRetry(0, new Error("boom"))).toBe(true)
    expect(shouldRetry(2, new Error("boom"))).toBe(false)
  })

  test("SP-UX-b1: the shared client uses it for queries and never retries mutations", () => {
    const defaults = createQueryClient().getDefaultOptions()
    expect(defaults.queries?.retry).toBe(shouldRetry)
    expect(defaults.mutations?.retry).toBe(false)
  })
})
