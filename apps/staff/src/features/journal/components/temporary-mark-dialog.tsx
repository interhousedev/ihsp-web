"use client"

import type { Journal } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@ihsp/ui"
import { TemporaryMarkRow } from "../../lessons/components/temporary-marks-row"
import { fullName } from "../../shared/utils/people"

type Student = Journal["students"][number]
type Cell = Student["cells"][number]

/** Sets, changes or clears the temporary mark of one student in one lesson (the journal's pencil). */
export function TemporaryMarkDialog({
  open,
  onOpenChange,
  lessonId,
  student,
  cell,
  date,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  student: Student
  cell: Cell
  date: string
}) {
  const t = useT("journal")
  const name = fullName(student)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("temporaryMarkFor", { name, date })}</DialogTitle>
          <DialogDescription>{t("temporaryMarkHint")}</DialogDescription>
        </DialogHeader>
        <ul className="divide-y rounded-lg border">
          <TemporaryMarkRow lessonId={lessonId} student={student} mark={cell.temporary_mark} />
        </ul>
      </DialogContent>
    </Dialog>
  )
}
