"use client"

import { getLmsCourseDraftQuery, getLmsCourseStudentsQuery, type CourseStudent } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, Input, Progress } from "@ihsp/ui"
import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { EditorFrame } from "../../editor/components/editor-frame"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { personName } from "../../shared/utils/people"
import { can } from "../../shared/utils/permissions"
import { LinkButton } from "../../shared/components/link-button"
import { CourseBroadcastHistory } from "../../admin/components/course-broadcast-history"

function StudentCard({
  student,
  courseId,
  stepTitles,
}: {
  student: CourseStudent
  courseId: string
  stepTitles: Map<string, string>
}) {
  const t = useT("students")
  const format = useFormatters()
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold">{personName(student.user)}</span>
          {student.completed_at ? <Badge>{t("completed", { date: format.date(student.completed_at) })}</Badge> : null}
        </div>
        <Progress value={student.progress_pct} aria-label={t("progressOf", { name: personName(student.user) })}>
          <span className="text-muted-foreground ms-auto text-xs tabular-nums">{student.progress_pct}%</span>
        </Progress>
        {student.attempts.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t("noAttempts")}</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {student.attempts.map((attempt) => (
              <li key={attempt.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 break-words">{stepTitles.get(attempt.step_id) ?? t("step")}</span>
                <span className="tabular-nums">
                  {attempt.score}/{attempt.max_score}
                </span>
                <Badge variant={attempt.passed ? "default" : "destructive"}>
                  {attempt.passed ? t("passed") : t("failed")}
                </Badge>
                <span className="text-muted-foreground text-xs">{format.dateTime(attempt.submitted_at)}</span>
                <LinkButton
                  href={hrefs.attempt(attempt.id, courseId)}
                  size="sm"
                  variant="outline"
                  className="min-h-11 md:min-h-7"
                >
                  {t("review")}
                </LinkButton>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** `/edit/students/?id=`: enrolled students with progress and test results (UF-LMS-15). */
export function StudentsPage({ courseId }: { courseId: string }) {
  const t = useT("students")
  const students = useQuery(getLmsCourseStudentsQuery(courseId))
  const [search, setSearch] = useState("")

  return (
    <EditorFrame courseId={courseId} current="students" title={t("title")} requires={["review"]}>
      {(permissions) => (
        <StudentsBody
          courseId={courseId}
          students={students}
          search={search}
          onSearch={setSearch}
          canReadDraft={can(permissions, "edit") || can(permissions, "view_drafts")}
          canBroadcast={can(permissions, "publish") || can(permissions, "manage_staff")}
        />
      )}
    </EditorFrame>
  )
}

function StudentsBody({
  courseId,
  students,
  search,
  onSearch,
  canReadDraft,
  canBroadcast,
}: {
  courseId: string
  students: UseQueryResult<CourseStudent[]>
  search: string
  onSearch: (value: string) => void
  canReadDraft: boolean
  canBroadcast: boolean
}) {
  const t = useT("students")
  const draft = useQuery({ ...getLmsCourseDraftQuery(courseId), enabled: canReadDraft, retry: false })
  const stepTitles = useMemo(() => {
    const map = new Map<string, string>()
    for (const section of draft.data?.outline ?? []) for (const step of section.steps) map.set(step.step_id, step.title)
    return map
  }, [draft.data])
  const needle = search.trim().toLowerCase()

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchLabel")}
        className="h-11 max-w-md md:h-8"
      />
      <QueryState query={students} isEmpty={(items) => items.length === 0} emptyText={t("empty")}>
        {(items) => {
          const shown = items.filter((student) => personName(student.user).toLowerCase().includes(needle))
          return shown.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noMatches")}</p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {shown.map((student) => (
                <li key={student.user.id}>
                  <StudentCard student={student} courseId={courseId} stepTitles={stepTitles} />
                </li>
              ))}
            </ul>
          )
        }}
      </QueryState>
      {canBroadcast ? <CourseBroadcastHistory courseId={courseId} /> : null}
    </div>
  )
}
