"use client"

import type { Journal } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("temporaryMarkFor", { name, date })}
      description={t("temporaryMarkHint")}
    >
      <ul className="min-w-0 divide-y rounded-lg border">
        <TemporaryMarkRow lessonId={lessonId} student={student} mark={cell.temporary_mark} />
      </ul>
    </ResponsiveDialog>
  )
}
