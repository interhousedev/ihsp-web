import { HttpResponse } from "msw"

/** An RFC 7807 problem response as the API sends it. */
export function problem(status: number, type: string, params: Record<string, unknown> = {}): Response {
  return HttpResponse.json(
    { type, title: type, status, params },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}
