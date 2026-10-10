"use client"

import type { Journal, JournalParams } from "@ihsp/api"
import { todayIso, useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, MarkBadge, cn } from "@ihsp/ui"
import Link from "next/link"
import { toast } from "sonner"
import { lessonHref } from "../../shared/utils/lesson-time"
import { fullName } from "../../shared/utils/people"
import { useToggleAbsence } from "../hooks/use-toggle-absence"
import { JournalCell } from "./journal-cell"

/**
 * The journal grid (STF-9, UF-STF-07): students are rows, lessons of the term are columns. The first column and the
 * header stay in place while the grid scrolls sideways, so it works at 360 px. A column header opens the lesson;
 * a column without attendance is shaded "not taken".
 */
export function JournalGrid({ journal, params }: { journal: Journal; params: JournalParams }) {
  const t = useT("journal")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const toggle = useToggleAbsence(params)
  const today = todayIso()

  if (journal.students.length === 0 || journal.lessons.length === 0) return null

  return (
    <div className="relative max-h-[70dvh] w-full overflow-auto rounded-lg border" data-testid="journal-grid">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="bg-muted sticky top-0 left-0 z-30 min-w-36 border-b border-e p-2 text-start font-medium"
            >
              {t("student")}
            </th>
            {journal.lessons.map((lesson) => {
              const notTaken = !lesson.attendance_submitted && lesson.date <= today
              return (
                <th
                  key={lesson.id}
                  scope="col"
                  className={cn(
                    "bg-muted sticky top-0 z-20 min-w-20 border-b p-1 align-top font-normal",
                    notTaken && "bg-muted/70",
                  )}
                >
                  <Link
                    href={lessonHref(lesson.id)}
                    className="hover:bg-accent focus-visible:ring-ring flex min-h-11 flex-col items-center gap-0.5 rounded-md p-1 text-center outline-none focus-visible:ring-2"
                  >
                    <span className="font-medium tabular-nums">
                      {f.date(lesson.date, { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">{lesson.topic ?? t("noTopic")}</span>
                    {notTaken ? (
                      <Badge variant="outline" className="text-xs">
                        {t("notTaken")}
                      </Badge>
                    ) : null}
                  </Link>
                </th>
              )
            })}
            <th scope="col" className="bg-muted sticky top-0 z-20 border-b border-s p-2 text-center font-medium">
              {t("absences")}
            </th>
            <th scope="col" className="bg-muted sticky top-0 z-20 border-b p-2 text-center font-medium">
              {t("semesterMark")}
            </th>
          </tr>
        </thead>
        <tbody>
          {journal.students.map((student) => (
            <tr key={student.user_id}>
              <th
                scope="row"
                className="bg-background sticky left-0 z-10 min-w-36 border-b border-e p-2 text-start font-medium"
              >
                {fullName(student)}
              </th>
              {journal.lessons.map((lesson) => {
                const cell = student.cells.find((item) => item.lesson_id === lesson.id)
                const notTaken = !lesson.attendance_submitted && lesson.date <= today
                return (
                  <td
                    key={lesson.id}
                    className={cn("border-b p-0.5 text-center", notTaken && "bg-muted/50")}
                    data-not-taken={notTaken}
                  >
                    {cell ? (
                      <JournalCell
                        cell={cell}
                        studentName={fullName(student)}
                        date={f.date(lesson.date, { day: "numeric", month: "short" })}
                        editable={lesson.editable}
                        notTaken={notTaken}
                        onToggle={() =>
                          toggle.mutate(
                            {
                              lessonId: lesson.id,
                              studentId: student.user_id,
                              // present -> absent -> late -> present
                              absent: !cell.absent && !cell.late,
                              late: cell.absent,
                            },
                            { onError: (error) => toast.error(errorMessage(error)) },
                          )
                        }
                      />
                    ) : null}
                  </td>
                )
              })}
              <td className="border-b border-s p-2 text-center tabular-nums">{student.absences}</td>
              <td className="border-b p-2 text-center">
                <MarkBadge mark={student.semester_mark} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
