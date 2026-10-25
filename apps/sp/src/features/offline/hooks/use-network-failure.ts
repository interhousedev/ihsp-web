"use client"

import { isNetworkError } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

/** True after a request failed because the network is unreachable, until a later request succeeds (WEB-30). */
export function useNetworkFailure(): boolean {
  const queryClient = useQueryClient()
  const [failed, setFailed] = useState(false)

  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== "updated") return
        if (event.action.type === "error" && isNetworkError(event.action.error)) setFailed(true)
        else if (event.action.type === "success") setFailed(false)
      }),
    [queryClient],
  )

  return failed
}
