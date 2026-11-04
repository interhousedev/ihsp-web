"use client"

import { useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"

export type AttendanceStatusValue = "present" | "absent" | "excused" | "late"

/**
 * The one attendance status shown in the lesson view and in the journal: a green tick for present, "нб" for an absence
 * (the same label in every language), a letter for late and excused. A lesson whose attendance is not taken shows a dash
 * for a student, never a tick: nothing was marked yet.
 */
export function AttendanceStatus({
  state,
  notTaken = false,
  className,
}: {
  state: AttendanceStatusValue
  notTaken?: boolean
  className?: string
}) {
  const t = useT("lessonDetail.attendance")

  if (state === "present" && notTaken) {
    return (
      <span role="img" aria-label={t("notTaken")} className={cn("text-muted-foreground text-xs", className)}>
        –
      </span>
    )
  }
  if (state === "present") {
    return (
      <span role="img" aria-label={t("present")} className={cn("text-success inline-flex", className)}>
        <Icons.check className="size-4" aria-hidden />
      </span>
    )
  }
  if (state === "absent") {
    return (
      <span
        title={t("absent")}
        className={cn("bg-destructive/10 text-destructive rounded-md px-1.5 py-0.5 text-xs font-semibold", className)}
      >
        {t("absentMark")}
        <span className="sr-only"> {t("absent")}</span>
      </span>
    )
  }
  if (state === "excused") {
    return (
      <span
        title={t("excused")}
        className={cn("bg-muted text-foreground rounded-md border px-1.5 py-0.5 text-xs font-semibold", className)}
      >
        {t("excusedMark")}
        <span className="sr-only"> {t("excused")}</span>
      </span>
    )
  }
  return (
    <span
      title={t("late")}
      className={cn("bg-warning-muted text-warning rounded-md px-1.5 py-0.5 text-xs font-semibold", className)}
    >
      {t("lateMark")}
      <span className="sr-only"> {t("late")}</span>
    </span>
  )
}
