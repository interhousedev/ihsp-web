"use client"

import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

type Tone = "default" | "secondary" | "destructive" | "outline"

const TONES: Record<string, Tone> = {
  active: "secondary",
  blocked: "destructive",
  disabled: "destructive",
  left: "outline",
  archived: "outline",
  cancelled: "destructive",
  failed: "destructive",
  needs_reauth: "destructive",
  pending_activation: "outline",
  deactivated: "outline",
  draft: "outline",
  scheduled: "default",
  sending: "default",
  sent: "secondary",
  partial: "outline",
  success: "secondary",
  running: "default",
  queued: "outline",
  stopping: "outline",
  done: "secondary",
}

/** A status word as a badge: translated when `status.<value>` exists, the raw value otherwise. */
export function StatusBadge({ status }: { status: string | null | undefined }) {
  const t = useT("status")
  if (!status) return <span className="text-muted-foreground">—</span>
  return <Badge variant={TONES[status] ?? "outline"}>{t.has(status) ? t(status) : status}</Badge>
}
