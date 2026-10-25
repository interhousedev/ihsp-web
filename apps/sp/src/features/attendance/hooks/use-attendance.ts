"use client"

import { getMeAttendanceQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** No `from` / `to` means the current term (the server picks the period). */
export function useAttendance(from: string | null, to: string | null) {
  return useQuery(getMeAttendanceQuery({ from: from ?? undefined, to: to ?? undefined }))
}
