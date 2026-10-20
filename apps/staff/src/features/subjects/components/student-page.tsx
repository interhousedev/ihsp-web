"use client"

import { getTeachingStudentQuery, type TeachingStudent } from "@ihsp/api"
import { formatDate, formatDateTime, useT } from "@ihsp/i18n"
import { TemporaryGpa } from "@ihsp/features-core"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { subjectGroupHref } from "../utils/hrefs"

const CARD = "bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-4 ring-1"

function Marks({ record }: { record: TeachingStudent }) {
  const t = useT("subjects.student")
  return (
    <section aria-labelledby="student-marks" className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="student-marks" className="text-lg font-semibold">
          {t("marks")}
        </h2>
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
      </div>
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
    </section>
  )
}

function Homework({ record }: { record: TeachingStudent }) {
  const t = useT("subjects.student")
  return (
    <section aria-labelledby="student-homework" className={CARD}>
      <h2 id="student-homework" className="text-lg font-semibold">
        {t("homework")}
      </h2>
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
    </section>
  )
}

function Attendance({ record }: { record: TeachingStudent }) {
  const t = useT("subjects.student")
  return (
    <section aria-labelledby="student-attendance" className={CARD}>
      <h2 id="student-attendance" className="text-lg font-semibold">
        {t("attendance")}
      </h2>
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
    </section>
  )
}

/** `/subjects/student/?id=&group=&subgroup=&student=`: a student's marks, homework and attendance in the subject. */
export function StudentPage() {
  const ts = useT("subjects")
  const [id] = useQueryState("id", parseAsString)
  const [groupId] = useQueryState("group", parseAsString)
  const [subgroup] = useQueryState("subgroup", parseAsInteger)
  const [studentId] = useQueryState("student", parseAsString)
  const ready = !!id && !!groupId && !!studentId
  const query = useQuery({
    ...getTeachingStudentQuery(id ?? "", groupId ?? "", subgroup, studentId ?? ""),
    enabled: ready,
  })
  if (!ready) {
    return (
      <PageContainer title={ts("title")}>
        <StateView state="empty" emptyText={ts("noId")} />
      </PageContainer>
    )
  }
  return (
    <QueryState query={query} rows={4}>
      {(record) => (
        <PageContainer
          title={`${record.student.last_name} ${record.student.first_name}`}
          description={`${record.subject_name} · ${record.group_name}`}
        >
          <BackLink href={subjectGroupHref(id, groupId, subgroup)} label={ts("student.back")} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Marks record={record} />
            <Attendance record={record} />
            <div className="md:col-span-2">
              <Homework record={record} />
            </div>
          </div>
        </PageContainer>
      )}
    </QueryState>
  )
}
