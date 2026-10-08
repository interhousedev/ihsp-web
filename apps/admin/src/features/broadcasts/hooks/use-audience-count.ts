"use client"

import { postAdminBroadcastsAudienceCount, type Audience } from "@ihsp/api"
import { useDebounce } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { hasAudience } from "../utils/broadcast-form"

const COUNT_DELAY_MS = 300

/** Live recipient count: re-asked a moment after the audience filters stop changing (UF-ADM-08 step 2). */
export function useAudienceCount(audience: Audience) {
  const key = JSON.stringify(audience)
  const settled = useDebounce(key, COUNT_DELAY_MS)
  const settledAudience = JSON.parse(settled) as Audience
  const query = useQuery({
    queryKey: ["admin", "broadcasts", "audience-count", settled],
    queryFn: ({ signal }) => postAdminBroadcastsAudienceCount({ audience: settledAudience }, { signal }),
    enabled: hasAudience(settledAudience),
    staleTime: 10_000,
  })
  return {
    count: hasAudience(audience) ? (query.data?.count ?? null) : 0,
    pending: hasAudience(audience) && (key !== settled || query.isFetching),
    failed: query.isError,
  }
}
