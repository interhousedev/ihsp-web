"use client"

import { api, keys, seg, type PublicStudentCard } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export type TimedCard = {
  card: PublicStudentCard
  /** Server clock minus the local clock, in ms, from the response's `Date` header; 0 when the header is not readable. */
  offsetMs: number
}

/** The offset of the server clock from the `Date` header of a response, `0` when it is missing or not a date. */
export function serverOffset(response: Pick<Response, "headers">, receivedAt: number): number {
  const server = Date.parse(response.headers.get("Date") ?? "")
  return Number.isNaN(server) ? 0 : server - receivedAt
}

/**
 * The public card with the server's clock offset. The generated client hides response headers, so the raw response is
 * read here; a visitor's own clock may be minutes off, and the card's expiry is on the server's clock.
 */
export function usePublicCard(token: string | null) {
  return useQuery({
    queryKey: [...keys.public.studentCard(token ?? ""), "timed"] as const,
    enabled: Boolean(token),
    retry: false,
    queryFn: async ({ signal }): Promise<TimedCard> => {
      const response = await api.request<Response>({
        method: "GET",
        path: `/v1/public/student-cards/${seg(token ?? "")}`,
        auth: "none",
        responseType: "stream",
        signal,
      })
      const receivedAt = Date.now()
      const card = (await response.json()) as PublicStudentCard
      return { card, offsetMs: serverOffset(response, receivedAt) }
    },
  })
}
