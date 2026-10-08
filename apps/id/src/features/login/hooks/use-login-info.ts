"use client"

import { getIdLoginQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { challengeUsedTarget } from "../../shared/utils/challenge"
import { redirectTo } from "../../shared/utils/redirect"

/**
 * Loads the Hydra login request. An already authenticated browser (`skip`) is sent on at once, and a used challenge
 * (`410 auth/challenge-used`) follows its `redirect_to`; `redirecting` is true in both cases.
 */
export function useLoginInfo(challenge: string) {
  const query = useQuery({
    ...getIdLoginQuery(challenge),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  const skipTarget = query.data?.skip ? query.data.redirect_to : null
  const usedTarget = challengeUsedTarget(query.error)
  const target = skipTarget ?? usedTarget

  useEffect(() => {
    if (target) redirectTo(target)
  }, [target])

  return { query, redirecting: target !== null }
}
