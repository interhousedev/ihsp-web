"use client"

import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { LessonSources } from "./lesson-sources"

/** The lesson sources of one subject (by its academic id) in a dialog. */
export function LessonSourcesDialog({
  subject,
  open,
  onOpenChange,
}: {
  subject: { id: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("subjects.lessonSources")
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={subject ? t("title", { name: subject.name }) : ""}>
      {subject ? <LessonSources key={subject.id} subjectId={subject.id} /> : null}
    </ResponsiveDialog>
  )
}
