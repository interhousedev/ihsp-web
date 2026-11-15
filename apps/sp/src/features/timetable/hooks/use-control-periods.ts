"use client"

import { getMeControlPeriodsQuery, type ControlPeriodItem } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

const NONE: ControlPeriodItem[] = []

/** The student's ПК and ИК weeks with the exams in them; empty while loading or when the request fails. */
export function useControlPeriods(): readonly ControlPeriodItem[] {
  return useQuery(getMeControlPeriodsQuery()).data?.items ?? NONE
}
