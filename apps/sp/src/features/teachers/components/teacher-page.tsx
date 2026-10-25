"use client"

import { isApiError, type MyTeacher } from "@ihsp/api"
import { TeacherAvatar } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Badge, PageContainer, StateView } from "@ihsp/ui"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { useMyTeacher } from "../hooks/use-my-teacher"
import { TEACHERS_HREF, subjectHref, teacherName } from "../utils/teacher-display"
import { ContactChips } from "./contact-chips"
import { TeacherTimetable } from "./teacher-timetable"

/** `/teachers/view/?id=`: the teacher's photo, subjects and contacts, then the weekly timetable in every group. */
export function TeacherPage() {
  const t = useT("teachers.detail")
  const [id] = useQueryState("id", parseAsString)
  const query = useMyTeacher(id)
  const notFound = id === null || (query.isError && isApiError(query.error) && query.error.status === 404)

  return (
    <PageContainer title={query.data ? teacherName(query.data) : t("back")}>
      <BackLink href={TEACHERS_HREF} label={t("back")} />
      {notFound ? (
        <StateView state="empty" emptyText={t("notFound")} />
      ) : (
        <QueryState query={query} rows={4}>
          {(teacher) => <TeacherBody teacher={teacher} />}
        </QueryState>
      )}
    </PageContainer>
  )
}

function TeacherBody({ teacher }: { teacher: MyTeacher }) {
  const t = useT("teachers.detail")
  const name = teacherName(teacher)
  return (
    <>
      <header className="flex flex-wrap items-start gap-4">
        <TeacherAvatar name={name} photoUrl={teacher.photo_url} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">{t("subjects")}</span>
            <ul className="flex flex-wrap gap-1.5">
              {teacher.subject_refs.map((subject) => (
                <li key={subject.id}>
                  <Link href={subjectHref(subject.id)} className="rounded-full">
                    <Badge variant="secondary">{subject.name}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <ContactChips contacts={teacher.contacts} />
          {teacher.contacts.note ? <p className="text-sm whitespace-pre-line">{teacher.contacts.note}</p> : null}
        </div>
      </header>
      <TeacherTimetable teacherId={teacher.id} />
    </>
  )
}
