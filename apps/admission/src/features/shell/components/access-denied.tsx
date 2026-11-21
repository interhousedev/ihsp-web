"use client"

import { ApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn, Icons, StateView } from "@ihsp/ui"

/** Sections of a student that the student shares with staff; each has a label in `staff.tabs`. */
export type DeniedSection =
  | "profile"
  | "words"
  | "alignment"
  | "courses"
  | "list"
  | "tests"
  | "review"
  | "checklist"
  | "comments"
  | "readiness"
  | "tasks"
  | "documents"

/** A 403 on a student's section: the student has not shared it (never a failure of the connection). */
export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}

/** "The student has not shared <section> yet": lock icon and one line; `compact` is a single inline row. */
export function AccessDenied({ section, compact }: { section: DeniedSection; compact?: boolean }) {
  const t = useT("staff")
  const name = t(`tabs.${section}`)
  if (compact)
    return (
      <p role="status" className={cn("text-muted-foreground flex items-center gap-2 text-sm")}>
        <Icons.lock aria-hidden className="size-4 shrink-0" />
        {t("denied.title", { section: name })}
      </p>
    )
  return (
    <StateView
      state="empty"
      icon={<Icons.lock aria-hidden />}
      title={t("denied.title", { section: name })}
      description={t("denied.text")}
    />
  )
}
