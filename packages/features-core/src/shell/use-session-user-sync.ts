"use client"

import { getMe, keys } from "@ihsp/api"
import { useAuthStore, useSession } from "@ihsp/auth"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

/** Profile photo links are presigned for about an hour; reload well before that. */
export const SESSION_USER_REFRESH_MS = 40 * 60_000

/**
 * Keeps the session user (name, photo link) fresh: reloads `GET /v1/id/me` every 40 minutes, when the tab regains
 * focus after that time, and puts the answer into the session so the header avatar never shows an expired link.
 */
export function useSessionUserSync(): void {
  const { session } = useSession()
  const signedIn = session !== null
  const query = useQuery({
    queryKey: keys.id.me(),
    queryFn: ({ signal }) => getMe({ signal }),
    enabled: signedIn,
    staleTime: SESSION_USER_REFRESH_MS,
    refetchInterval: SESSION_USER_REFRESH_MS,
    refetchOnWindowFocus: true,
  })
  useEffect(() => {
    const user = query.data
    if (user && user !== useAuthStore.getState().user) useAuthStore.getState().setUser(user)
  }, [query.data])
}
