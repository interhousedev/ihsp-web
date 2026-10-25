/** `application/problem+json` body as produced by the backend (backend § 3.7). */
export type ProblemBody = {
  type?: string
  title?: string
  status?: number
  message_key?: string
  params?: Record<string, unknown>
  errors?: unknown[]
}

export class ApiError extends Error {
  readonly type: string
  readonly status: number
  readonly title: string
  readonly message_key: string | null
  readonly params: Record<string, unknown>
  readonly errors: unknown[] | null

  constructor(input: {
    type: string
    status: number
    title: string
    message_key?: string | null
    params?: Record<string, unknown>
    errors?: unknown[] | null
  }) {
    super(input.title)
    this.name = "ApiError"
    this.type = input.type
    this.status = input.status
    this.title = input.title
    this.message_key = input.message_key ?? null
    this.params = input.params ?? {}
    this.errors = input.errors ?? null
  }
}

export const NETWORK_ERROR_TYPE = "network/unreachable"

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError || (error instanceof Error && error.name === "ApiError")
}

/** True when the request never reached the server (offline, DNS, CORS, aborted by the network). */
export function isNetworkError(error: unknown): boolean {
  return isApiError(error) && error.type === NETWORK_ERROR_TYPE
}

export function networkError(cause: unknown): ApiError {
  const message = cause instanceof Error ? cause.message : "Network request failed"
  return new ApiError({ type: NETWORK_ERROR_TYPE, status: 0, title: message })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Builds an `ApiError` from a failed response; tolerates non-problem bodies (HTML from a proxy, empty body). */
export async function parseApiError(response: Response): Promise<ApiError> {
  let body: unknown = null
  const text = await response.text().catch(() => "")
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }
  if (isRecord(body)) {
    return new ApiError({
      type: typeof body.type === "string" ? body.type : `http/${response.status}`,
      status: typeof body.status === "number" ? body.status : response.status,
      title: typeof body.title === "string" ? body.title : response.statusText || `HTTP ${response.status}`,
      message_key: typeof body.message_key === "string" ? body.message_key : null,
      params: isRecord(body.params) ? body.params : {},
      errors: Array.isArray(body.errors) ? body.errors : null,
    })
  }
  return new ApiError({
    type: `http/${response.status}`,
    status: response.status,
    title: response.statusText || `HTTP ${response.status}`,
  })
}

/**
 * Maps an error to a message key: `errors.<type with "/" replaced by ".">`
 * (`attendance/window-closed` -> `errors.attendance.window-closed`).
 * Falls back to `errors.generic` for unknown errors, or when `has` says the key has no translation.
 */
export function errorMessageKey(error: unknown, has?: (key: string) => boolean): string {
  if (!isApiError(error) || !error.type) return "errors.generic"
  const key = `errors.${error.type.split("/").join(".")}`
  if (has && !has(key)) return "errors.generic"
  return key
}

/** Reads `params.<name>` of an API error with a type guard supplied by the caller. */
export function getErrorParam<T>(error: unknown, name: string, guard: (value: unknown) => value is T): T | undefined {
  if (!isApiError(error)) return undefined
  const value = error.params[name]
  return guard(value) ? value : undefined
}

/** `common/conflict` (409) with the other editor's version in `params.theirs`. */
export function getConflictTheirs<T>(error: unknown): T | undefined {
  if (!isApiError(error) || error.type !== "common/conflict") return undefined
  return error.params.theirs as T | undefined
}

/** `common/conflict` (409) of the timetable editor with `params.conflicts`. */
export function getConflictList<T>(error: unknown): T[] | undefined {
  if (!isApiError(error) || error.type !== "common/conflict") return undefined
  const list = error.params.conflicts
  return Array.isArray(list) ? (list as T[]) : undefined
}

/** Seconds from `params.retry_after` of `common/rate-limited` and `auth/locked`. */
export function getRetryAfter(error: unknown): number | undefined {
  if (!isApiError(error)) return undefined
  const value = error.params.retry_after
  return typeof value === "number" ? value : undefined
}
