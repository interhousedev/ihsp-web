"use client"

import { getMeAlertsQuery, getMeTodayQuery, getNotificationsQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export function useToday() {
  return useQuery(getMeTodayQuery())
}

/** Alerts and announcements are extras: when they fail, the rest of Today still shows. */
export function useAlerts() {
  return useQuery(getMeAlertsQuery())
}

export function useAnnouncements() {
  return useQuery(getNotificationsQuery({ filter: "announcements", limit: 3 }))
}
