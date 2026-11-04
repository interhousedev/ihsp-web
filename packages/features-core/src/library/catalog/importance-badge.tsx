"use client"

import type { Importance } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { StatusBadge, type StatusTone } from "@ihsp/ui"

const TONE: Record<Importance, StatusTone> = {
  essential: "destructive",
  recommended: "warning",
  further: "neutral",
}

/** Essential / Recommended / Further reading chip of a reading-list entry. */
export function ImportanceBadge({ importance, className }: { importance: Importance; className?: string }) {
  const t = useT("library.importance")
  return <StatusBadge tone={TONE[importance]} label={t(importance)} className={className} />
}
