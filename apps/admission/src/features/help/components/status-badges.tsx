"use client"

import { useT } from "@ihsp/i18n"
import { StatusBadge, type StatusTone } from "@ihsp/ui"

const REQUEST_TONE: Record<string, StatusTone> = {
  open: "info",
  assigned: "info",
  accepted: "warning",
  declined: "destructive",
  delivered: "success",
  closed: "neutral",
  cancelled: "neutral",
  expired: "neutral",
}

const PROOF_TONE: Record<string, StatusTone> = {
  pending: "info",
  verified: "success",
  partial: "warning",
  unverified: "neutral",
  unverifiable: "neutral",
  self_provided: "neutral",
}

/** The text for a backend value: our translation when we have one, else the value itself. */
export function useValueLabel(group: string) {
  const t = useT("help")
  return (value: string) => (t.has(`${group}.${value}`) ? t(`${group}.${value}`) : value)
}

export function HelpStatusBadge({ status }: { status: string }) {
  const label = useValueLabel("status")
  return <StatusBadge tone={REQUEST_TONE[status] ?? "neutral"} label={label(status)} />
}

/** `self_provided` reads "Self-reported, not checked": the product never presents it as verified. */
export function ProofStatusBadge({ status }: { status: string }) {
  const label = useValueLabel("proofStatus")
  return (
    <StatusBadge
      tone={PROOF_TONE[status] ?? "neutral"}
      icon={status === "verified" ? "badgeCheck" : undefined}
      label={label(status)}
    />
  )
}
