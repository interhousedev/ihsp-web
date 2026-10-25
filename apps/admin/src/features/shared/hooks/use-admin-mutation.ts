"use client"

import { useErrorMessage } from "@ihsp/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type Options<TVars, TData> = {
  mutationFn: (variables: TVars) => Promise<TData>
  /** Query key prefixes to refetch after a success (`keys.admin.users.all()`). */
  invalidate?: readonly (readonly unknown[])[]
  /** Toast text on success (already translated). */
  success?: string | ((data: TData, variables: TVars) => string)
  onSuccess?: (data: TData, variables: TVars) => void
  /** Show the error in the caller (inline) instead of a toast. */
  inlineError?: boolean
}

/** A mutation that refetches the lists it changed and reports the result with a toast. */
export function useAdminMutation<TVars = void, TData = unknown>({
  mutationFn,
  invalidate = [],
  success,
  onSuccess,
  inlineError = false,
}: Options<TVars, TData>) {
  const queryClient = useQueryClient()
  const errorMessage = useErrorMessage()
  return useMutation<TData, unknown, TVars>({
    mutationFn,
    onSuccess: async (data, variables) => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
      if (success) toast.success(typeof success === "function" ? success(data, variables) : success)
      onSuccess?.(data, variables)
    },
    onError: (error) => {
      if (!inlineError) toast.error(errorMessage(error))
    },
  })
}
