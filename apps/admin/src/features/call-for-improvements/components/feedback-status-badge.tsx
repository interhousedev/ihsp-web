"use client"

import type { AdminFeedbackStatus } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

const TONES: Record<AdminFeedbackStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  in_review: "outline",
  planned: "secondary",
  done: "secondary",
  rejected: "destructive",
}

/** The status of a feedback item as a badge, translated. */
export function FeedbackStatusBadge({ status }: { status: AdminFeedbackStatus }) {
  const t = useT("callForImprovements")
  return <Badge variant={TONES[status]}>{t(`status.${status}`)}</Badge>
}
