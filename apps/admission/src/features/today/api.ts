"use client"

import { useQuery } from "@tanstack/react-query"
import { getApiClient } from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"

/** Wire types of `GET /v1/admission/today` (generated `TodayOut`). */
export type SeasonId = "explore" | "build" | "choose" | "write" | "submit" | "results"
export type TodayAction = { key: string; title: string; why: string; minutes: number; href: string; list_entry_id: string | null }
export type TodayDeadline = { date: string; href: string; kind: string; list_entry_id: string | null; title: string }
export type TodayCheck = { key: string; label: string; done: boolean; href: string; progress: string | null }
export type Today = {
  next: TodayAction[]
  deadlines: TodayDeadline[]
  readiness: { percent: number }
  season: { key: SeasonId; source: "auto" | "override"; checklist: TodayCheck[] }
  streak: { days: number; last7: boolean[]; today_done: boolean }
}

export const SEASONS: readonly SeasonId[] = ["explore", "build", "choose", "write", "submit", "results"]

export const TODAY_KEY = ["admission", "today"] as const

/** `GET /today`: season, next steps, streak, readiness and deadlines; the texts come localised from the server. */
export function useToday() {
  const locale = useLocale()
  return useQuery({
    queryKey: [...TODAY_KEY, locale],
    queryFn: ({ signal }) =>
      getApiClient().get<Today>("/v1/admission/today", { headers: { "Accept-Language": locale }, signal }),
  })
}
