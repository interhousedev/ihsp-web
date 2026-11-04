"use client"

import { getTeachingStudentQuery, type TeachingStudent } from "@ihsp/api"
import { TemporaryGpa } from "@ihsp/features-core"
import { formatDate, formatDateTime, useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import type { ReactNode } from "react"

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card role="region" aria-labelledby={id}>
      <CardHeader>
        <CardTitle id={id} role="heading" aria-level={2} className="text-base">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  )
}

function Marks({ record }: { record: TeachingStudent }) {
  const t = useT("subjects.student")
  return (
    <Section id="student-marks" title={t("marks")}>
      <p className="text-sm">
        {t("average")}: <strong>{record.average === null ? "—" : record.average.toFixed(2)}</strong>
        {record.semester_mark === null ? null : (
          <span className="text-muted-foreground">
            {" "}
            · {t("semesterMark", { value: record.semester_mark })}
            <TemporaryGpa value={record.gpa_with_temporary} />
          </span>
        )}
      </p>
      {record.marks.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noMarks")}</p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label={t("marks")}>
          {record.marks.map((mark, index) => (
            <li
              key={`${mark.date}-${index}`}
              className="bg-muted flex min-w-14 flex-col items-center rounded-lg px-2 py-1 text-xs"
              title={t(`type.${mark.type === "midterm" || mark.type === "final" ? mark.type : "lesson"}`)}
            >
              <span className="text-base font-semibold">{mark.value}</span>
              <span className="text-muted-foreground">{formatDate(mark.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function Homework({ record }: { record: TeachingStudent }) {
  const t = useT("subjects.student")
  return (
    <Section id="student-homework" title={t("homework")}>
      {record.homework.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noHomework")}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {record.homework.map((item) => (
            <li key={item.lesson_id} className="flex flex-col gap-0.5">
              <span className="font-medium">
                {formatDate(item.due_date ?? item.date)}
                {item.text ? ` · ${item.text}` : ""}
              </span>
              <span className="text-muted-foreground">
                {item.done_at ? t("done", { when: formatDateTime(item.done_at) }) : t("notDone")}
              </span>
              {item.note ? <span>{t("note", { note: item.note })}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function Attendance({ record }: { record: TeachingStudent }) {
  const t = useT("subjects.student")
  return (
    <Section id="student-attendance" title={t("attendance")}>
      <p className="text-sm">
        {record.lessons_with_attendance === null
          ? t("absences", { count: record.absences })
          : t("absencesOf", { count: record.absences, total: record.lessons_with_attendance })}
      </p>
      {record.absent_lessons.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {record.absent_lessons.map((item) => (
            <li key={item.lesson_id}>
              {formatDate(item.date)}
              {item.excused ? ` · ${t("excused")}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  )
}

/** The record of the student in one taught group: marks with the average, homework and attendance. */
export function SubjectRecord({ record }: { record: TeachingStudent }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Marks record={record} />
      <Attendance record={record} />
      <div className="md:col-span-2">
        <Homework record={record} />
      </div>
    </div>
  )
}

/** The teaching endpoint's record; idle until the subject, group and student are all known. */
export function useTeachingStudent(
  subjectId: string | null,
  groupId: string | null,
  subgroup: number | null,
  studentId: string | null,
): UseQueryResult<TeachingStudent> {
  return useQuery({
    ...getTeachingStudentQuery(subjectId ?? "", groupId ?? "", subgroup, studentId ?? ""),
    enabled: !!subjectId && !!groupId && !!studentId,
  })
}
