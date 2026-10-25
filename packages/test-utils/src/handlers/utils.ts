import type { Page } from "@ihsp/api"
import { HttpResponse, type PathParams } from "msw"
import { TEST_API_URL } from "../fixtures/env"
import { uuid } from "../fixtures/world"

/** Absolute URL of an API path in the test environment, e.g. `apiUrl("/v1/me/today")`. */
export function apiUrl(path: string): string {
  return `${TEST_API_URL}${path}`
}

/** One path parameter as a string (`:id`). */
export function param(params: PathParams, name: string): string {
  const value = params[name]
  if (typeof value === "string") return value
  return value?.[0] ?? ""
}

export function query(request: Request): URLSearchParams {
  return new URL(request.url).searchParams
}

/** Parses a JSON body; an empty or invalid body gives `{}`. */
export async function readJson<T extends object>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>
  } catch {
    return {}
  }
}

/** `Page<T>` with `?cursor=` (an offset) and `?limit=` (default 20, max 100). */
export function paginate<T>(items: readonly T[], request: Request): Page<T> {
  const search = query(request)
  const limit = Math.min(Math.max(Number(search.get("limit") ?? 20) || 20, 1), 100)
  const offset = Number(search.get("cursor") ?? 0) || 0
  const next = offset + limit
  return {
    items: items.slice(offset, next),
    next_cursor: next < items.length ? String(next) : null,
  }
}

/** Case-insensitive substring match used by `?query=` and `?q=` filters. */
export function matches(text: string | null | undefined, needle: string | null): boolean {
  if (!needle) return true
  return (text ?? "").toLowerCase().includes(needle.toLowerCase())
}

export type ProblemOptions = { params?: Record<string, unknown>; messageKey?: string; errors?: unknown[] }

/** `application/problem+json` response (backend § 3.7). */
export function problem(status: number, type: string, title: string, options: ProblemOptions = {}): Response {
  return HttpResponse.json(
    {
      type,
      title,
      status,
      message_key: options.messageKey ?? type.replace("/", "-"),
      params: options.params ?? {},
      ...(options.errors ? { errors: options.errors } : {}),
    },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}

export function notFound(what = "Resource"): Response {
  return problem(404, "common/not-found", `${what} not found`)
}

export function noContent(): Response {
  return new HttpResponse(null, { status: 204 })
}

export function accepted(): Response {
  return new HttpResponse(null, { status: 202 })
}

let counter = 1000

/** A fresh, unique UUID for entities created by mutation handlers. */
export function nextId(kind: number): string {
  counter += 1
  return uuid(kind, counter)
}
