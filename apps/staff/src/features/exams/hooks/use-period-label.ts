"use client"

import type { ControlPeriod } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { useCallback } from "react"

/** `12 Oct – 17 Oct`: the days of a control week. */
export function usePeriodLabel(): (period: ControlPeriod) => string {
  const f = useFormatters()
  return useCallback(
    (period) => {
      const options = { day: "numeric", month: "short" } as const
      return `${f.date(period.start, options)} – ${f.date(period.end, options)}`
    },
    [f],
  )
}
