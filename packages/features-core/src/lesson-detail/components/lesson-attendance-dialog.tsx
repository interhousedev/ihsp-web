"use client"

import { useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogTitle, StateView } from "@ihsp/ui"
import { useStaffLesson } from "../hooks/use-staff-lesson"
import { AttendanceSheetView } from "./attendance-sheet"

/**
 * The attendance sheet of one lesson in a pop-up (the journal opens it; no navigation). `startAllPresent` opens the
 * draft with everyone marked present: the teacher changes the exceptions and saves; nothing is submitted on open.
 */
export function LessonAttendanceDialog({
  lessonId,
  startAllPresent = false,
  onClose,
}: {
  lessonId: string
  startAllPresent?: boolean
  onClose: () => void
}) {
  const t = useT("lessonDetail.attendance")
  const query = useStaffLesson(lessonId)

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        {query.data ? (
          <AttendanceSheetView
            lesson={query.data.lesson}
            sheet={query.data.attendance}
            startAllPresent={startAllPresent}
          />
        ) : query.isError ? (
          <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <StateView state="loading" rows={4} />
        )}
      </DialogContent>
    </Dialog>
  )
}
