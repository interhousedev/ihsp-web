"use client"

import type { StaffAssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { examStatus, type ExamStatus } from "../utils/exam-status"

type Tone = "default" | "secondary" | "destructive" | "outline"

/** A date that waits for confirmation stands out; a week without a date is plain. */
const TONES: Record<ExamStatus, Tone> = {
  planned: "secondary",
  tentative: "default",
  cancelled: "destructive",
  undated: "outline",
}

/** Planned, Not confirmed, Cancelled or Date not set. */
export function ExamStatusBadge({ item }: { item: Pick<StaffAssessmentItem, "has_date" | "status"> }) {
  const t = useT("exams.status")
  const status = examStatus(item)
  return <Badge variant={TONES[status]}>{t(status)}</Badge>
}
