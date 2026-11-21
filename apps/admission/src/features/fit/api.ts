"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getApiClient } from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import type { FitList, FitPreferences, Ratings } from "./types"

const BASE = "/v1/admission"

/** Under the list key, so every list change (add, remove, edit) refreshes the fit as well. */
export const FIT_KEY = ["admission", "list", "fit"] as const
export const PREFERENCES_KEY = ["admission", "fit-preferences"] as const

/** The why/raise lines come localised by `Accept-Language`, so the locale is part of the key. */
export function useListFit() {
  const locale = useLocale()
  return useQuery({
    queryKey: [...FIT_KEY, locale],
    queryFn: ({ signal }) =>
      getApiClient().get<FitList>(`${BASE}/list/fit`, { headers: { "Accept-Language": locale }, signal }),
  })
}

export function useFitPreferences() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: ({ signal }) => getApiClient().get<FitPreferences>(`${BASE}/me/fit-preferences`, { signal }),
  })
}

export function useSaveFitPreferences() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (ratings: Ratings) => getApiClient().put<FitPreferences>(`${BASE}/me/fit-preferences`, { ratings }),
    onSuccess: (saved) => {
      client.setQueryData(PREFERENCES_KEY, saved)
      void client.invalidateQueries({ queryKey: FIT_KEY })
    },
  })
}
