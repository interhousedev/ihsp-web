"use client"

import { useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"
import type { ExamStatus } from "../utils/controls"

/** Planned, Not confirmed (a suggestion nobody confirmed) or Date not set (a control week without a date). */
export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  const t = useT("exams")
  return (
    <Badge
      variant={status === "planned" ? "default" : status === "tentative" ? "outline" : "secondary"}
      className={cn(status === "tentative" && "border-dashed")}
    >
      {t(`status.${status}`)}
    </Badge>
  )
}
