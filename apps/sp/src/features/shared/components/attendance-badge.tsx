"use client"

import type { AttendanceState } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

const VARIANT: Record<AttendanceState, "default" | "secondary" | "destructive" | "outline"> = {
  present: "secondary",
  absent: "destructive",
  excused: "outline",
  not_taken: "outline",
}

/** Present, absent, excused, or "not taken yet". */
export function AttendanceBadge({ state }: { state: AttendanceState }) {
  const t = useT("attendanceStates")
  return <Badge variant={VARIANT[state]}>{t(state)}</Badge>
}
