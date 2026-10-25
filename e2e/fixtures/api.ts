/** Direct API calls from a spec, authorized with the access token the page itself is using. */

import type { Page, Request } from "@playwright/test"
import { URLS } from "./env"

const tokens = new WeakMap<Page, string>()

/** Remembers the newest bearer token the page sends to the API (the access token lives only in page memory). */
export function trackToken(page: Page): void {
  page.on("request", (request: Request) => {
    const header = request.headers()["authorization"]
    if (header?.startsWith("Bearer ") && request.url().startsWith(URLS.api))
      tokens.set(page, header.slice("Bearer ".length))
  })
}

/** The page's current access token; waits until the page has made an authorized call. */
export async function accessToken(page: Page, timeoutMs = 20_000): Promise<string> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const token = tokens.get(page)
    if (token) return token
    await page.waitForTimeout(200)
  }
  throw new Error("The page has not sent an authorized API request yet")
}

export class ApiCallError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    message: string,
  ) {
    super(message)
  }
}

/** `GET`/`POST`/… against the backend with the page's token. Returns parsed JSON (`undefined` for an empty body). */
export async function api<T>(page: Page, method: string, path: string, body?: unknown): Promise<T> {
  const token = await accessToken(page)
  const response = await fetch(`${URLS.api}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok)
    throw new ApiCallError(response.status, text, `${method} ${path} answered ${response.status}: ${text}`)
  return (text ? JSON.parse(text) : undefined) as T
}

/** ISO date (`YYYY-MM-DD`) in Asia/Tashkent, `offsetDays` from today. */
export function tashkentDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(now)
}
