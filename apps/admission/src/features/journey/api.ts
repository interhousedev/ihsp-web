"use client"

import { getApiClient, type AdmissionPreferences } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useReadiness } from "../readiness/api"
import { deriveJourney, type Journey } from "./derive"

export const PREFERENCES_KEY = ["admission", "preferences"] as const

/** `GET /v1/admission/preferences`. */
export function usePreferencesStatus() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: () => getApiClient().get<AdmissionPreferences>("/v1/admission/preferences"),
  })
}

/** The journey derived from readiness and preferences; `pending` until both are known, `error` if either failed. */
export function useJourney(): { journey: Journey | null; pending: boolean; error: boolean } {
  const readiness = useReadiness()
  const prefs = usePreferencesStatus()
  const journey = useMemo(() => {
    if (!readiness.data || !prefs.data) return null
    const scores: Record<string, number> = {}
    for (const c of readiness.data.components) scores[c.key] = c.score
    return deriveJourney({ scores, preferencesCompleted: prefs.data.completed })
  }, [readiness.data, prefs.data])
  return {
    journey,
    pending: readiness.isPending || prefs.isPending,
    error: readiness.isError || prefs.isError,
  }
}
