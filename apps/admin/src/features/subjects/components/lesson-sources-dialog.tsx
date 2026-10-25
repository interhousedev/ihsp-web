"use client"

import { useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ihsp/ui"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {subject ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("title", { name: subject.name })}</DialogTitle>
            </DialogHeader>
            <LessonSources key={subject.id} subjectId={subject.id} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
