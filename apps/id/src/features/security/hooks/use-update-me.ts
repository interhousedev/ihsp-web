"use client"

import { keys, type UserMe } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

/** Puts a fresh `UserMe` (returned by the OTP and email calls) into the query cache. */
export function useUpdateMe(): (user: UserMe) => void {
  const queryClient = useQueryClient()
  return useCallback((user: UserMe) => queryClient.setQueryData(keys.id.me(), user), [queryClient])
}
