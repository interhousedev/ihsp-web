"use client"

import { useT } from "@ihsp/i18n"
import { Badge, PageContainer, StateView } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../../shared/components/back-link"
import { useMyTeachers } from "../hooks/use-my-teachers"
import { TEACHERS_HREF, teacherName } from "../utils/teacher-display"
import { ContactChips } from "./contact-chips"
import { TeacherStatusLine } from "./teacher-status"
import { WeekGrid } from "./week-grid"

/** `/teachers/view/?id=`: one teacher with contacts, status and the weekly schedule with rooms. */
export function TeacherPage() {
  const t = useT("teachers.detail")
  const [id] = useQueryState("id", parseAsString)
  const teachers = useMyTeachers()
  const teacher = teachers.data?.find((item) => item.id === id)
  const back = <BackLink href={TEACHERS_HREF} label={t("back")} />
  if (teachers.isPending)
    return (
      <PageContainer title={t("back")}>
        <StateView state="loading" rows={3} />
      </PageContainer>
    )
  if (teachers.isError && !teachers.data) {
    return (
      <PageContainer title={t("back")}>
        {back}
        <StateView state="error" error={teachers.error} onRetry={() => void teachers.refetch()} />
      </PageContainer>
    )
  }
  if (!teacher) {
    return (
      <PageContainer title={t("back")}>
        {back}
        <StateView state="empty" emptyText={t("notFound")} />
      </PageContainer>
    )
  }
  return (
    <PageContainer title={teacherName(teacher)}>
      {back}
      <TeacherStatusLine teacher={teacher} />
      <ul className="flex flex-wrap gap-1.5">
        {teacher.subjects.map((subject) => (
          <li key={subject}>
            <Badge variant="secondary">{subject}</Badge>
          </li>
        ))}
      </ul>
      <ContactChips contacts={teacher.contacts} />
      {teacher.contacts.note ? <p className="text-sm whitespace-pre-line">{teacher.contacts.note}</p> : null}
      <h2 className="text-lg font-semibold">{t("week")}</h2>
      {teacher.week.length === 0 ? <p className="text-muted-foreground text-sm">{t("noLessons")}</p> : null}
      <WeekGrid week={teacher.week} />
    </PageContainer>
  )
}
