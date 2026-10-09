"use client"

import { postNotebookDiscover, type DiscoverBody, type DiscoverResponse } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { useRefreshWebQuota, useSetWebQuota, useWebSearchErrorMessage } from "../../web-search"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"

export type DiscoverMode = DiscoverBody["mode"]

/** One Discover run as the box and the results share it. */
export type DiscoverFlow = {
  run: (query: string, mode: DiscoverMode) => void
  /** The search is running. */
  pending: boolean
  /** Why the last search failed, in the user's language; `null` when it did not. */
  error: string | null
  /** What was asked last (also while it is running). */
  request: DiscoverBody | null
  /** What came back, once it did. */
  response: DiscoverResponse | null
  /** The results replace the source list: while the search runs and after it, until `close`. */
  open: boolean
  close: () => void
}

/**
 * `POST /notebooks/{id}/discover`. A search spends today's web searches, so the quota cache is set from the response
 * (no extra request) and refreshed when the search fails (a 429 means the cached number was out of date).
 */
export function useDiscover(notebookId: string): DiscoverFlow {
  const setQuota = useSetWebQuota()
  const refreshQuota = useRefreshWebQuota()
  const webSearchMessage = useWebSearchErrorMessage()
  const notebookMessage = useNotebookErrorMessage()
  const search = useMutation<DiscoverResponse, unknown, DiscoverBody>({
    mutationFn: (body) => postNotebookDiscover(notebookId, body),
    onSuccess: (response) => setQuota(response.quota),
    onError: () => void refreshQuota(),
  })
  return {
    run: (query, mode) => search.mutate({ query, mode }),
    pending: search.isPending,
    error: search.isError ? (webSearchMessage(search.error) ?? notebookMessage(search.error)) : null,
    request: search.variables ?? null,
    response: search.data ?? null,
    open: search.isPending || search.isSuccess,
    close: search.reset,
  }
}
