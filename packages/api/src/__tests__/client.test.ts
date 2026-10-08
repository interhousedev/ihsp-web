import { describe, expect, test } from "bun:test"
import { createApiClient } from "../client"
import { isApiError } from "../errors"

type Call = { url: string; init: RequestInit }

function client(
  responses: Response[],
  overrides: { onRefresh?: () => Promise<boolean>; onUnauthorized?: () => void } = {},
) {
  const calls: Call[] = []
  let refreshes = 0
  const queue = [...responses]
  const api = createApiClient({
    baseUrl: () => "http://api.test",
    getToken: () => "token-1",
    onRefresh: overrides.onRefresh ?? (async () => (refreshes += 1) > 0),
    onUnauthorized: overrides.onUnauthorized ?? (() => undefined),
    fetch: (async (input: string, init: RequestInit) => {
      calls.push({ url: input, init })
      return queue.shift() ?? new Response(null, { status: 500 })
    }) as unknown as typeof fetch,
  })
  return { api, calls, refreshes: () => refreshes }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

describe("api client", () => {
  test("sends the bearer token and no credentials; `auth: none` sends no token", async () => {
    const { api, calls } = client([json({ ok: true }), json({ ok: true })])
    await api.get("/v1/me/today")
    await api.get("/v1/public/shares/x", { auth: "none" })

    expect(new Headers(calls[0]?.init.headers).get("Authorization")).toBe("Bearer token-1")
    expect(calls[0]?.init.credentials).toBe("omit")
    expect(new Headers(calls[1]?.init.headers).get("Authorization")).toBeNull()
  })

  test("`cache` reaches fetch, so learning GETs can revalidate past the 60 s browser cache", async () => {
    const { api, calls } = client([json({}), json({})])
    await api.get("/v1/lms/courses/x/steps/y", { cache: "no-cache" })
    await api.get("/v1/me/today")

    expect(calls[0]?.init.cache).toBe("no-cache")
    expect(calls[1]?.init.cache).toBeUndefined()
  })

  test("a 401 refreshes once and retries; a second 401 calls onUnauthorized", async () => {
    const first = client([new Response(null, { status: 401 }), json({ ok: 1 })])
    expect(await first.api.get<{ ok: number }>("/v1/me/today")).toEqual({ ok: 1 })
    expect(first.refreshes()).toBe(1)
    expect(first.calls).toHaveLength(2)

    let unauthorized = 0
    const second = client([new Response(null, { status: 401 }), new Response(null, { status: 401 })], {
      onUnauthorized: () => {
        unauthorized += 1
      },
    })
    await expect(second.api.get("/v1/me/today")).rejects.toBeDefined()
    expect(unauthorized).toBe(1)
  })

  test("application/problem+json becomes an ApiError with type, status and params", async () => {
    const { api } = client([
      json(
        {
          type: "common/conflict",
          title: "Conflict",
          status: 409,
          message_key: "k",
          params: { theirs: { version: 3 } },
        },
        409,
      ),
    ])
    const error = await api.put("/v1/staff/lessons/x/attendance", {}).catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    expect(error).toMatchObject({ type: "common/conflict", status: 409, params: { theirs: { version: 3 } } })
  })
})
