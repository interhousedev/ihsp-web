"use client"

import { getStaffLessonQuery, type ResourceItem } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardHeader, CardTitle, MarkBadge, PageContainer, StateView } from "@ihsp/ui"
import { useQueries } from "@tanstack/react-query"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../shared/components/back-link"
import { optionLabel } from "../journal/utils/selection"
import { lessonHref } from "../shared/utils/lesson-time"
import { useTeacherStudents } from "./hooks/use-teacher-students"
import { attendanceOf, marksOf, nameOf, recentLessons, type StudentSummary } from "./utils"

const RECENT_LESSONS = 6

/**
 * The profile of a student (`?id=`), from the teacher's journals: marks by subject, attendance, and the latest
 * lessons with their materials.
 */
export function StudentProfile() {
  const t = useT("students")
  const [id] = useQueryState("id", parseAsString)
  const { students, isPending } = useTeacherStudents()
  const student = students.find((item) => item.userId === id)

  return (
    <PageContainer title={student ? nameOf(student) : t("profile")}>
      <BackLink href="/students/" label={t("back")} />
      {isPending && !student ? <StateView state="loading" rows={4} /> : null}
      {!isPending && !student ? <StateView state="empty" emptyText={t("notFound")} /> : null}
      {student ? <Profile student={student} /> : null}
    </PageContainer>
  )
}

function Profile({ student }: { student: StudentSummary }) {
  const t = useT("students")
  const attendance = attendanceOf(student)
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("attendance")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
          <span data-testid="attendance-summary">
            {t("attendanceSummary", { absences: attendance.absences, lessons: attendance.lessons })}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("marks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y" data-testid="marks-by-subject">
            {student.entries.map((entry) => (
              <SubjectMarks key={entry.option.subject.id + entry.option.audience_key} entry={entry} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <RecentLessons student={student} />
    </div>
  )
}

function SubjectMarks({ entry }: { entry: StudentSummary["entries"][number] }) {
  const t = useT("students")
  const f = useFormatters()
  const marks = marksOf(entry)
  return (
    <li className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{optionLabel(entry.option)}</span>
        <span className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{t("semester")}</span>
          <MarkBadge mark={entry.student.semester_mark} size="sm" />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {marks.length === 0 ? <span className="text-muted-foreground text-xs">
            {entry.student.semester_mark !== null ? t("noLessonMarks") : t("noMarks")}
          </span> : null}
        {marks.map((item, index) => (
          <span key={index} className="flex items-center gap-1" title={item.date}>
            <MarkBadge mark={item.mark} size="sm" />
            <span className="text-muted-foreground text-[11px]">
              {f.date(item.date, { day: "numeric", month: "short" })}
            </span>
          </span>
        ))}
        {entry.student.absences > 0 ? (
          <Badge variant="outline">{t("absences", { count: entry.student.absences })}</Badge>
        ) : null}
      </div>
    </li>
  )
}

function RecentLessons({ student }: { student: StudentSummary }) {
  const t = useT("students")
  const f = useFormatters()
  const lessons = recentLessons(student, todayIso(), RECENT_LESSONS)
  const details = useQueries({ queries: lessons.map((lesson) => getStaffLessonQuery(lesson.lessonId)) })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("recentLessons")}</CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? <StateView state="empty" emptyText={t("noLessons")} /> : null}
        <ul className="flex flex-col divide-y" data-testid="recent-lessons">
          {lessons.map((lesson, index) => {
            const materials: ResourceItem[] = (details[index]?.data?.materials ?? []).filter((item) => !item.hidden)
            return (
              <li key={lesson.lessonId} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <Link href={lessonHref(lesson.lessonId)} className="min-w-0 text-sm font-medium hover:underline">
                    {f.date(lesson.date, { day: "numeric", month: "short" })} · {lesson.subjectName}
                  </Link>
                  <span className="flex shrink-0 items-center gap-1">
                    {lesson.absent ? (
                      <Badge variant="destructive">{lesson.excused ? t("excused") : t("absent")}</Badge>
                    ) : null}
                    {lesson.marks.map((mark, markIndex) => (
                      <MarkBadge key={markIndex} mark={mark} size="sm" />
                    ))}
                  </span>
                </div>
                {lesson.topic ? (
                  <span className="text-muted-foreground line-clamp-2 text-xs">{lesson.topic}</span>
                ) : null}
                {materials.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5" aria-label={t("materials")}>
                    {materials.map((item) => (
                      <li key={item.link_id}>
                        <a
                          href={item.short_url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-muted hover:bg-accent inline-flex max-w-56 items-center truncate rounded-md px-2 py-0.5 text-xs"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
