"use client"

import { getAiWebSearchQuery, keys, type WebQuota } from "@ihsp/api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

const STALE_MS = 60_000

/** What a composer needs to know about web search today. */
export type WebQuotaState = {
  /** The quota once loaded; `undefined` while loading or when the request failed. */
  quota: WebQuota | undefined
  /** True only when the server says web search is on; hide the switch otherwise (also while loading). */
  enabled: boolean
  /** Searches left today (0 while unknown). */
  remaining: number
  /** True when web search is on but every search of today is used. */
  spent: boolean
}

/**
 * `GET /v1/ai/web-search` for the assistant and the notebook chat: one cache entry shared by both, fresh for a minute.
 * Call `useRefreshWebQuota()` after every send with `web_search: true` and after Discover.
 */
export function useWebQuota(): WebQuotaState {
  const { data } = useQuery({ ...getAiWebSearchQuery(), staleTime: STALE_MS })
  const enabled = data?.enabled === true
  const remaining = data?.remaining ?? 0
  return { quota: data, enabled, remaining, spent: enabled && remaining <= 0 }
}

/** Marks the quota stale so the next render reads today's searches again. */
export function useRefreshWebQuota(): () => Promise<void> {
  const queryClient = useQueryClient()
  return useCallback(() => queryClient.invalidateQueries({ queryKey: keys.ai.webSearch() }), [queryClient])
}

/** Writes a quota that came back with a response (Discover sends one), so no extra request is needed. */
export function useSetWebQuota(): (quota: WebQuota) => void {
  const queryClient = useQueryClient()
  return useCallback((quota) => queryClient.setQueryData(keys.ai.webSearch(), quota), [queryClient])
}
