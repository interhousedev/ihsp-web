"use client"

import { useT } from "@ihsp/i18n"
import { StatusBadge, type StatusTone } from "@ihsp/ui"

const PROOF_TONE: Record<string, StatusTone> = {
  pending: "info",
  verified: "success",
  partial: "warning",
  unverified: "neutral",
  unverifiable: "neutral",
  self_provided: "neutral",
  checked: "success",
  failed: "destructive",
}

/** `self_provided` reads "Self-reported, not checked": the product never presents it as verified. */
export function ProofStatusBadge({ status }: { status: string }) {
  const t = useT("proofs")
  return (
    <StatusBadge
      tone={PROOF_TONE[status] ?? "neutral"}
      icon={status === "verified" ? "badgeCheck" : undefined}
      label={t.has(`status.${status}`) ? t(`status.${status}`) : status}
    />
  )
}
