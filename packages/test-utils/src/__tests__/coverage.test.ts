import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { matchRequestUrl } from "msw"
import { allHandlers } from "../handlers"
import { TEST_API_URL, TEST_STORAGE_URL } from "../fixtures/env"

type Route = { method: string; path: string }

const ENDPOINTS_DIR = join(import.meta.dir, "../../../api/src/endpoints")

const CALL = /api\.(get|post|put|patch|delete)(?:<[^(]*?>)?\(\s*(["`])([^"`]+)\2/g
const REQUEST = /method:\s*"(GET|POST|PUT|PATCH|DELETE)",\s*path:\s*(["`])([^"`]+)\2/g

/** `${seg(id)}` and `:id` both become `{}` so a client path and a handler path can be compared. */
function normalize(path: string): string {
  return path.replace(/\$\{[^}]+\}/g, "{}").replace(/:[A-Za-z]+/g, "{}")
}

/** Every `api.<method>(path)` call of the typed endpoint functions of `@ihsp/api`. */
function clientRoutes(): Route[] {
  const routes: Route[] = []
  for (const file of readdirSync(ENDPOINTS_DIR).filter((name) => name.endsWith(".ts"))) {
    const source = readFileSync(join(ENDPOINTS_DIR, file), "utf8")
    for (const match of source.matchAll(CALL)) {
      routes.push({ method: (match[1] ?? "").toUpperCase(), path: normalize((match[3] ?? "").split("?")[0] ?? "") })
    }
    for (const match of source.matchAll(REQUEST)) {
      routes.push({ method: match[1] ?? "", path: normalize((match[3] ?? "").split("?")[0] ?? "") })
    }
  }
  return routes
}

type Described = { method: string; origin: string; path: string }

function handlerRoutes(): Described[] {
  return allHandlers.map((handler) => {
    const info = handler.info as { method: string; path: string }
    const url = new URL(info.path.replace(/:[A-Za-z]+/g, "x"))
    return {
      method: String(info.method).toUpperCase(),
      origin: url.origin,
      path: normalize(info.path.replace(url.origin, "")),
    }
  })
}

/** Routes the typed client has no function for: the token hook is called by Hydra, the rest by services or browsers. */
const HANDLER_ONLY = new Set([
  "POST /v1/oauth/token-hook",
  "GET /internal/emis/{}/profile",
  "GET /internal/emis/{}/subjects",
  "GET /internal/emis/{}/ratings",
  "GET /r/{}",
  "PUT /uploads/{}",
])

describe("MSW handlers cover the typed API client", () => {
  const client = clientRoutes()
  const handlers = handlerRoutes()
  const handled = new Set(handlers.map((route) => `${route.method} ${route.path}`))

  test("the scan finds the endpoints", () => {
    expect(client.length).toBeGreaterThan(200)
  })

  test("every endpoint function has a handler", () => {
    const missing = [...new Set(client.map((route) => `${route.method} ${route.path}`))].filter(
      (key) => !handled.has(key),
    )
    expect(missing).toEqual([])
  })

  test("every handler belongs to an endpoint function, the Hydra token hook or an external service", () => {
    const known = new Set(client.map((route) => `${route.method} ${route.path}`))
    const orphans = [...handled].filter((key) => !known.has(key) && !HANDLER_ONLY.has(key))
    expect(orphans).toEqual([])
  })

  test("a concrete request reaches the handler written for it, not an earlier wildcard one", () => {
    const wrong: string[] = []
    for (const route of new Set(client.map((entry) => `${entry.method} ${entry.path}`))) {
      const [method = "", path = ""] = route.split(" ")
      const url = `${TEST_API_URL}${path.replace(/\{\}/g, "sample")}`
      const first = allHandlers.find((handler) => {
        const info = handler.info as { method: string; path: string }
        return String(info.method).toUpperCase() === method && matchRequestUrl(new URL(url), info.path).matches
      })
      const info = first?.info as { path: string } | undefined
      const got = info ? normalize(info.path.replace(TEST_API_URL, "")) : "none"
      if (got !== path) wrong.push(`${route} -> ${got}`)
    }
    expect(wrong).toEqual([])
  })

  test("API handlers match TEST_API_URL, the object store matches TEST_STORAGE_URL", () => {
    const origins = new Set(handlers.map((route) => route.origin))
    expect([...origins].sort()).toEqual([TEST_API_URL, TEST_STORAGE_URL].sort())
  })
})
