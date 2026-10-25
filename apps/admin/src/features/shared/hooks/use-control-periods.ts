"use client"

import type { ControlPeriods } from "@ihsp/api"
import { useTerms } from "./use-lookups"

const NONE: ControlPeriods = {}

/** The control weeks of the current term (the first term when none is marked current); none while loading. */
export function useControlPeriods(): ControlPeriods {
  const terms = useTerms()
  const term = terms.data?.find((item) => item.is_current) ?? terms.data?.[0]
  return term?.control_periods ?? NONE
}
