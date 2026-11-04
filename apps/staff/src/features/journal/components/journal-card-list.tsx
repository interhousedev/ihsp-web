"use client"

import type { Journal } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { IconEdit, MarkBadge, ScrollList } from "@ihsp/ui"
import { fullName } from "../../shared/utils/people"
import { JournalCell } from "./journal-cell"

type Student = Journal["students"][number]
type Cell = Student["cells"][number]
type Lesson = Journal["lessons"][number]

/**
 * The journal on a phone (below 768 px): one card per student, the lessons as rows with the same cell (the three-state
 * toggle) and the temporary-mark pencil. Replaces the horizontally scrolling grid there; desktop keeps the table.
 */
export function JournalCardList({
  journal,
  failed,
  today,
  onToggle,
  onExcuse,
  onEdit,
}: {
  journal: Journal
  failed: ReadonlySet<string>
  today: string
  onToggle: (lesson: Lesson, student: Student, cell: Cell, key: string) => void
  onExcuse: (lesson: Lesson, student: Student) => void
  onEdit: (lessonId: string, row: number) => void
}) {
  const t = useT("journal")
  const f = useFormatters()
  return (
    <ScrollList label={t("studentCards")}>
      <ul className="flex flex-col gap-3" data-testid="journal-cards">
        {journal.students.map((student, row) => (
          <li key={student.user_id} className="bg-card ring-foreground/10 flex flex-col gap-2 rounded-xl p-3 ring-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium break-words">{fullName(student)}</h3>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                {t("absences")}: <span className="tabular-nums">{student.absences}</span>
                <MarkBadge mark={student.semester_mark} size="sm" />
              </p>
            </div>
            <ul className="divide-y">
              {journal.lessons.map((lesson) => {
                const cell = student.cells.find((item) => item.lesson_id === lesson.id)
                if (!cell) return null
                const date = f.date(lesson.date, { day: "numeric", month: "short" })
                const notTaken = !lesson.attendance_submitted && lesson.date <= today
                const key = `${lesson.id}:${student.user_id}`
                return (
                  <li key={lesson.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0 text-sm">
                      <span className="font-medium tabular-nums">{date}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {lesson.topic ?? t("noTopic")}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <JournalCell
                        cell={cell}
                        studentName={fullName(student)}
                        date={date}
                        editable={lesson.editable}
                        notTaken={notTaken}
                        failed={failed.has(key)}
                        tabIndex={0}
                        onToggle={() => onToggle(lesson, student, cell, key)}
                        onExcuse={() => onExcuse(lesson, student)}
                      />
                      {lesson.editable ? (
                        <button
                          type="button"
                          aria-label={t("temporaryMarkFor", { name: fullName(student), date })}
                          title={t("temporaryMark")}
                          onClick={() => onEdit(lesson.id, row)}
                          className="hover:bg-accent text-muted-foreground focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-md outline-none focus-visible:ring-2"
                        >
                          <IconEdit className="size-3.5" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </ScrollList>
  )
}
