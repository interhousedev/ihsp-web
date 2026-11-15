"use client"

import { isNetworkError, keys } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

const MAINTENANCE_KEY = keys.public.maintenance()

/**
 * True after a request failed because the network is unreachable, until a later request succeeds (WEB-30). The
 * maintenance poll is a courtesy that fails silently, so it neither raises nor clears the flag.
 */
export function useNetworkFailure(): boolean {
  const queryClient = useQueryClient()
  const [failed, setFailed] = useState(false)

  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== "updated") return
        const key = event.query.queryKey
        if (key[0] === MAINTENANCE_KEY[0] && key[1] === MAINTENANCE_KEY[1]) return
        if (event.action.type === "error" && isNetworkError(event.action.error)) setFailed(true)
        else if (event.action.type === "success") setFailed(false)
      }),
    [queryClient],
  )

  return failed
}
