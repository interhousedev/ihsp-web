"use client"

import { getMeTeachersQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

const REFRESH_MS = 60_000

/** The teachers with their status; refreshed every minute so "now" and "next" stay right. */
export function useMyTeachers() {
  return useQuery({ ...getMeTeachersQuery(), refetchInterval: REFRESH_MS })
}
