"use client"

import { getApiClient } from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type CalendarEntry = {
  key: string
  source: "university" | "checklist" | "exam" | "opportunity"
  title: string
  day: string
  due_utc: string
  predicted: boolean
  url_path: string | null
  list_entry_id: string | null
}
export type FeedStatus = { active: boolean; alarm_offsets: number[]; default_offsets: number[] }
const BASE = "/v1/admission/calendar"
const FEED_KEY = ["admission", "calendar-feed"] as const

export function useCalendar(start: string, end: string) {
  const locale = useLocale()
  return useQuery({
    queryKey: ["admission", "calendar", start, end, locale],
    queryFn: () =>
      getApiClient().get<{ items: CalendarEntry[] }>(BASE, {
        query: { from: start, to: end },
        headers: { "Accept-Language": locale },
      }),
  })
}

export function useCalendarFeed() {
  return useQuery({ queryKey: FEED_KEY, queryFn: () => getApiClient().get<FeedStatus>(`${BASE}/feed`) })
}

export function useIssueCalendarFeed() {
  const client = useQueryClient()
  const locale = useLocale()
  return useMutation({
    mutationFn: () =>
      getApiClient().post<{ path: string; status: FeedStatus }>(`${BASE}/feed`, undefined, {
        headers: { "Accept-Language": locale },
      }),
    onSuccess: (data) => client.setQueryData(FEED_KEY, data.status),
  })
}

export function useRevokeCalendarFeed() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => getApiClient().delete<void>(`${BASE}/feed`),
    onSuccess: () => client.invalidateQueries({ queryKey: FEED_KEY }),
  })
}
