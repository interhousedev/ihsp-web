"use client"

import type { GroupProgressStudent, GroupProgressSubject } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@ihsp/ui"
import { TemporaryGpa } from "../temporary-gpa"
import { cellOf, formatMark, formatPercent } from "./format"

/** The details of one student: per subject the semester mark, ПК, ИК, the lesson average and the absences. */
export function StudentProgressSheet({
  student,
  subjects,
  onClose,
}: {
  student: GroupProgressStudent | null
  subjects: GroupProgressSubject[]
  onClose: () => void
}) {
  const t = useT("groupProgress")
  return (
    <Sheet open={student !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {student ? (
          <>
            <SheetHeader>
              <SheetTitle>
                {student.student.last_name} {student.student.first_name}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <p className="text-sm tabular-nums">
                {t("gpa")}: <strong>{formatMark(student.gpa)}</strong> · {t("absences")}: {student.absences}/
                {student.lessons} ({formatPercent(student.absence_rate)})
              </p>
              <ul className="flex flex-col gap-2">
                {subjects.map((subject) => {
                  const cell = cellOf(student, subject.id)
                  return (
                    <li key={subject.id} className="rounded-lg border p-3">
                      <h3 className="font-medium">{subject.name}</h3>
                      {cell ? (
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm tabular-nums">
                          <dt className="text-muted-foreground">{t("semesterMark")}</dt>
                          <dd className="font-semibold">
                            {formatMark(cell.semester_mark)}
                            <TemporaryGpa value={cell.gpa_with_temporary} />
                          </dd>
                          <dt className="text-muted-foreground">{t("midterm")}</dt>
                          <dd>{formatMark(cell.midterm_avg)}</dd>
                          <dt className="text-muted-foreground">{t("final")}</dt>
                          <dd>{formatMark(cell.final_avg)}</dd>
                          <dt className="text-muted-foreground">{t("lessonAvg")}</dt>
                          <dd>{formatMark(cell.lesson_avg)}</dd>
                          <dt className="text-muted-foreground">{t("absences")}</dt>
                          <dd>
                            {t("attendance", {
                              absences: cell.absences,
                              lessons: cell.lessons,
                              rate: formatPercent(cell.absence_rate),
                            })}
                          </dd>
                        </dl>
                      ) : (
                        <p className="text-muted-foreground mt-1 text-sm">{t("noData")}</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
