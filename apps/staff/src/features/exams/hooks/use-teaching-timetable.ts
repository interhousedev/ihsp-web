"use client"

import { getStaffTimetableQuery } from "@ihsp/api"
import { todayIso } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { teachingRange } from "../utils/teaching"

/** The teacher's next eight weeks: where the groups and subjects of the exam editor come from. */
export function useTeachingTimetable() {
  return useQuery(getStaffTimetableQuery(teachingRange(todayIso())))
}
