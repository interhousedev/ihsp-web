"use client"

import { getPublicStudentCardQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** The public card behind a permanent QR token; a `404` (unknown or replaced token) is not retried. */
export function usePublicCard(token: string | null) {
  return useQuery({ ...getPublicStudentCardQuery(token ?? ""), enabled: Boolean(token), retry: false })
}
