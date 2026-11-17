"use client"

import { useT } from "@ihsp/i18n"
import { StatusBadge, type StatusTone } from "@ihsp/ui"

const TONE: Record<string, StatusTone> = {
  requested: "info",
  proposed: "warning",
  accepted: "success",
  declined: "destructive",
  completed: "neutral",
  cancelled: "neutral",
}

export function ConsultationStatusBadge({ status }: { status: string }) {
  const t = useT("consultations")
  return (
    <StatusBadge tone={TONE[status] ?? "neutral"} label={t.has(`status.${status}`) ? t(`status.${status}`) : status} />
  )
}
