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

  test("a 401 from another host (baseUrl override) does not end the session", async () => {
    let unauthorized = 0
    const { api, refreshes } = client([new Response(null, { status: 401 }), new Response(null, { status: 401 })], {
      onUnauthorized: () => {
        unauthorized += 1
      },
    })
    await expect(api.get("/v1/rooms/x", { baseUrl: "http://other.test" })).rejects.toBeDefined()
    expect(refreshes()).toBe(1)
    expect(unauthorized).toBe(0)
  })

  test("a 401 with a domain type (emis/auth-failed) is an ApiError: no refresh, no retry, no sign-out", async () => {
    let unauthorized = 0
    const { api, refreshes, calls } = client(
      [
        new Response(JSON.stringify({ type: "emis/auth-failed", title: "EMIS", status: 401 }), {
          status: 401,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ],
      {
        onUnauthorized: () => {
          unauthorized += 1
        },
      },
    )
    const error = await api.get("/v1/me/student-card").catch((cause: unknown) => cause)
    expect(isApiError(error) && error.type).toBe("emis/auth-failed")
    expect(refreshes()).toBe(0)
    expect(calls).toHaveLength(1)
    expect(unauthorized).toBe(0)
  })

  test("a 401 for one action's credentials (auth/otp-invalid) is an ApiError: no refresh, no sign-out", async () => {
    let unauthorized = 0
    const { api, refreshes, calls } = client(
      [
        new Response(JSON.stringify({ type: "auth/otp-invalid", title: "Wrong code", status: 401 }), {
          status: 401,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ],
      {
        onUnauthorized: () => {
          unauthorized += 1
        },
      },
    )
    const error = await api.post("/v1/id/personal-tokens", { otp_code: "000000" }).catch((cause: unknown) => cause)
    expect(isApiError(error) && error.type).toBe("auth/otp-invalid")
    expect(refreshes()).toBe(0)
    expect(calls).toHaveLength(1)
    expect(unauthorized).toBe(0)
  })

  test("an auth/unauthorized 401 refreshes once, retries once and never refreshes again", async () => {
    const body = () =>
      new Response(JSON.stringify({ type: "auth/unauthorized", title: "No session", status: 401 }), {
        status: 401,
        headers: { "Content-Type": "application/problem+json" },
      })
    let unauthorized = 0
    const { api, refreshes, calls } = client([body(), body()], {
      onUnauthorized: () => {
        unauthorized += 1
      },
    })
    await expect(api.get("/v1/me/today")).rejects.toBeDefined()
    expect(refreshes()).toBe(1)
    expect(calls).toHaveLength(2)
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

  test("a base URL with a very long run of trailing slashes is trimmed quickly, not by a quadratic regex", async () => {
    const calls: Call[] = []
    const api = createApiClient({
      baseUrl: () => `http://api.test${"/".repeat(200_000)}`,
      getToken: () => null,
      onRefresh: async () => false,
      onUnauthorized: () => undefined,
      fetch: (async (input: string, init: RequestInit) => {
        calls.push({ url: input, init })
        return json({})
      }) as unknown as typeof fetch,
    })
    const started = performance.now()
    await api.get("/v1/me", { auth: "none" })
    expect(performance.now() - started).toBeLessThan(1_000)
    expect(calls[0]?.url).toBe("http://api.test/v1/me")
  })
})
