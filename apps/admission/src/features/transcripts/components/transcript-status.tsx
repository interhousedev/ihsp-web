"use client"

import { useT } from "@ihsp/i18n"
import { StatusBadge } from "@ihsp/ui"
import type { Transcript } from "../api"

const TONE = { requested: "info", ready: "success", cancelled: "neutral" } as const

export function TranscriptStatus({ status }: { status: Transcript["status"] }) {
  const t = useT("transcripts")
  return <StatusBadge tone={TONE[status]} label={t(`status.${status}`)} />
}
