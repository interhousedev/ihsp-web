"use client"

import { getStaffLessonTemporaryMarksQuery } from "@ihsp/api"
import type { RosterItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { TemporaryMarkRow } from "./temporary-marks-row"

/** The lesson's temporary marks (2 to 5) per roster student; they stay here until the teacher puts them into EMIS. */
export function TemporaryMarksSection({ lessonId, roster }: { lessonId: string; roster: RosterItem[] }) {
  const t = useT("temporaryMarks")
  const query = useQuery(getStaffLessonTemporaryMarksQuery(lessonId))
  return (
    <section id="journal" aria-labelledby="temporary-marks-title" className="flex flex-col gap-3">
      <h2 id="temporary-marks-title" className="text-lg font-semibold">
        {t("journalTitle")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("note")}</p>
      <QueryState query={query} rows={4}>
        {(data) => (
          <ul className="divide-y rounded-lg border">
            {roster.map((student) => (
              <TemporaryMarkRow
                key={student.user_id}
                lessonId={lessonId}
                student={student}
                mark={data.items.find((item) => item.student_id === student.user_id) ?? null}
              />
            ))}
          </ul>
        )}
      </QueryState>
    </section>
  )
}
