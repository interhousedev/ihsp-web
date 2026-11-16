"use client"

import { useT } from "@ihsp/i18n"
import { Pill, PillIndicator } from "@ihsp/ui"
import type { AdmissionMatchStatus as MatchStatus } from "@ihsp/api"
import { STATUS_TONE } from "../format"

/** Safety / Target / Reach. */
export function StatusPill({ status }: { status: MatchStatus | null }) {
  const t = useT("discover")
  if (status === null) return null
  return (
    <Pill tone={STATUS_TONE[status]}>
      <PillIndicator tone={STATUS_TONE[status]} />
      {t(`status.${status}`)}
    </Pill>
  )
}
