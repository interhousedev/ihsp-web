import { getConfig } from "@ihsp/config"
import { networkError, parseApiError } from "./errors"

/** Removes trailing slashes with a linear scan (a `/\/+$/` regex is quadratic on long runs of slashes). */
function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value.charCodeAt(end - 1) === 47) end--
  return value.slice(0, end)
}

/**
 * 401 types that reject the credentials of one action (a wrong one-time code or current password while signed
 * in), not the session: refreshing cannot fix them and signing the user out would lose their work.
 */
const ACTION_CREDENTIAL_TYPES: Record<string, true> = {
  "auth/invalid-credentials": true,
  "auth/otp-invalid": true,
  "auth/passkey-invalid": true,
  "auth/password-disabled": true,
  "auth/second-factor-required": true,
}

/**
 * Whether a 401 means that OUR session is invalid: no problem body, a bare `http/401`, or an `auth/*` type
 * (`auth/unauthorized` is the backend's) other than the action credential types. A 401 with a domain or upstream
 * type (`emis/auth-failed`) is an ordinary API error: refreshing or logging in again cannot fix it. The body is read
 * from a clone.
 */
async function isSessionProblem(response: Response): Promise<boolean> {
  try {
    const body: unknown = await response.clone().json()
    if (typeof body !== "object" || body === null || !("type" in body) || typeof body.type !== "string") return true
    if (ACTION_CREDENTIAL_TYPES[body.type] === true) return false
    return body.type.startsWith("auth/") || body.type.startsWith("http/")
  } catch {
    return true
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[]
export type QueryParams = { [key: string]: QueryValue }

export type ApiRequest = {
  method: HttpMethod
  /** Path starting with `/`, e.g. `/v1/me/today`. */
  path: string
  query?: QueryParams
  /** Serialised as JSON. */
  body?: unknown
  /** Sent as multipart (sets no `Content-Type`, the browser adds the boundary). */
  formData?: FormData
  /** Sent as is with its own type as `Content-Type` (raw audio uploads). */
  blob?: Blob
  /** `bearer` (default) sends `Authorization` and retries once after a refresh on 401; `none` sends no token and never retries. */
  auth?: "bearer" | "none"
  /** `include` only for the cookie endpoints under `/v1/oauth/`. */
  credentials?: "include" | "omit"
  headers?: Record<string, string>
  /**
   * `json` (default; empty body gives `undefined`), `blob` (CSV exports), `text` (iCal, HTML) or `stream`
   * (the raw `Response` of a successful request, to read a server-sent event body).
   */
  responseType?: "json" | "blob" | "text" | "stream"
  signal?: AbortSignal
  /**
   * HTTP cache mode of the request. Learning GETs are served `Cache-Control: private, max-age=60`; pass `"no-cache"` to
   * revalidate right after a change (a submit) instead of reading the browser's cached copy.
   */
  cache?: RequestCache
  /** Overrides the API origin (short links, room pages). */
  baseUrl?: string
}

export type CallOptions = Omit<ApiRequest, "method" | "path" | "body" | "formData" | "blob">

export type ApiClient = {
  request<T>(request: ApiRequest): Promise<T>
  get<T>(path: string, options?: CallOptions): Promise<T>
  post<T>(path: string, body?: unknown, options?: CallOptions): Promise<T>
  put<T>(path: string, body?: unknown, options?: CallOptions): Promise<T>
  patch<T>(path: string, body?: unknown, options?: CallOptions): Promise<T>
  delete<T>(path: string, options?: CallOptions & { body?: unknown }): Promise<T>
  /** Absolute URL for a path and query (used for links and tests). */
  url(path: string, query?: QueryParams, baseUrl?: string): string
}

export type ApiClientOptions = {
  /** Current access token (from `@ihsp/auth`), `null` when there is none. */
  getToken: () => string | null | Promise<string | null>
  /** Refreshes the session; resolves `true` when a new access token is available. */
  onRefresh: () => Promise<boolean>
  /** Called when a request is still unauthorised after a refresh attempt (the app starts the login). */
  onUnauthorized: () => void
  /** Defaults to `getConfig().API_URL`. */
  baseUrl?: () => string
  /** Defaults to `getConfig().APP_NAME`; sent as the `X-IHSP-App` header when set. */
  appName?: () => string | undefined
  fetch?: typeof fetch
}

export function buildQueryString(query: QueryParams | undefined): string {
  if (!query) return ""
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item))
    } else {
      search.append(key, String(value))
    }
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const resolveBase = options.baseUrl ?? (() => getConfig().API_URL)
  const resolveApp = options.appName ?? (() => getConfig().APP_NAME)
  const doFetch: (input: string, init: RequestInit) => Promise<Response> =
    options.fetch ?? ((input, init) => globalThis.fetch(input, init))
  let refreshing: Promise<boolean> | null = null

  /** Concurrent 401s share one refresh. */
  function refreshOnce(): Promise<boolean> {
    if (!refreshing) {
      refreshing = options
        .onRefresh()
        .catch(() => false)
        .finally(() => {
          refreshing = null
        })
    }
    return refreshing
  }

  function url(path: string, query?: QueryParams, baseUrl?: string): string {
    const base = trimTrailingSlashes(baseUrl ?? resolveBase())
    return `${base}${path}${buildQueryString(query)}`
  }

  async function send(request: ApiRequest): Promise<Response> {
    const headers = new Headers(request.headers)
    if (!headers.has("Accept")) {
      headers.set(
        "Accept",
        request.responseType === "json" || !request.responseType ? "application/json, application/problem+json" : "*/*",
      )
    }
    const app = resolveApp()
    if (app && !headers.has("X-IHSP-App")) headers.set("X-IHSP-App", app)
    let body: BodyInit | undefined
    if (request.formData) {
      body = request.formData
    } else if (request.blob) {
      headers.set("Content-Type", request.blob.type || "application/octet-stream")
      body = request.blob
    } else if (request.body !== undefined) {
      headers.set("Content-Type", "application/json")
      body = JSON.stringify(request.body)
    }
    if ((request.auth ?? "bearer") === "bearer") {
      const token = await options.getToken()
      if (token) headers.set("Authorization", `Bearer ${token}`)
    }
    try {
      return await doFetch(url(request.path, request.query, request.baseUrl), {
        method: request.method,
        headers,
        body,
        credentials: request.credentials ?? "omit",
        cache: request.cache,
        signal: request.signal,
      })
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw cause
      throw networkError(cause)
    }
  }

  async function request<T>(req: ApiRequest): Promise<T> {
    let response = await send(req)
    if (response.status === 401 && (req.auth ?? "bearer") === "bearer" && (await isSessionProblem(response))) {
      // One refresh and one retry per request; a 401 after that is final and never refreshes again.
      const refreshed = await refreshOnce()
      if (refreshed) response = await send(req)
      // A 401 from another host (`baseUrl` override: short links, rooms) says nothing about our session.
      if ((!refreshed || response.status === 401) && (req.baseUrl === undefined || req.baseUrl === resolveBase())) {
        options.onUnauthorized()
      }
    }
    if (!response.ok) throw await parseApiError(response)
    if (req.responseType === "stream") return response as T
    if (req.responseType === "blob") return (await response.blob()) as T
    if (req.responseType === "text") return (await response.text()) as T
    const text = await response.text()
    if (!text) return undefined as T
    try {
      return JSON.parse(text) as T
    } catch (cause) {
      throw networkError(cause)
    }
  }

  return {
    request,
    url,
    get: (path, callOptions) => request({ ...callOptions, method: "GET", path }),
    post: (path, body, callOptions) => request({ ...callOptions, method: "POST", path, body }),
    put: (path, body, callOptions) => request({ ...callOptions, method: "PUT", path, body }),
    patch: (path, body, callOptions) => request({ ...callOptions, method: "PATCH", path, body }),
    delete: (path, callOptions) => request({ ...callOptions, method: "DELETE", path }),
  }
}

let currentClient: ApiClient | null = null

/** Installs the client used by every endpoint function; called once by `@ihsp/auth` (or the app providers). */
export function setApiClient(client: ApiClient): void {
  currentClient = client
}

/** Before `setApiClient` is called requests are anonymous (no token, no refresh). */
export function getApiClient(): ApiClient {
  currentClient ??= createApiClient({
    getToken: () => null,
    onRefresh: async () => false,
    onUnauthorized: () => undefined,
  })
  return currentClient
}

/** Module-level singleton that delegates to the installed client; endpoint functions call this. */
export const api: ApiClient = {
  request: (req) => getApiClient().request(req),
  url: (path, query, baseUrl) => getApiClient().url(path, query, baseUrl),
  get: (path, callOptions) => getApiClient().get(path, callOptions),
  post: (path, body, callOptions) => getApiClient().post(path, body, callOptions),
  put: (path, body, callOptions) => getApiClient().put(path, body, callOptions),
  patch: (path, body, callOptions) => getApiClient().patch(path, body, callOptions),
  delete: (path, callOptions) => getApiClient().delete(path, callOptions),
}
