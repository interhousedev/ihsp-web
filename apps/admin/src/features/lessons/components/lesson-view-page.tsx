"use client"

import { LessonDetail, scrollToHash, useStaffLesson } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect } from "react"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"

/**
 * One lesson for Administration (ADM-10, STF-4): subject, audience, teacher, time, room and status, the topic,
 * homework, materials and the attendance sheet, all editable as the backend allows Administration (any lesson,
 * attendance also after the teachers' 7-day window). `?id=` is the lesson; the address hash scrolls to a section.
 * It is the page of the staff app (`LessonDetail`) opened inside the admin console.
 */
export function LessonViewPage() {
  const t = useT("lessons.view")
  const [id] = useQueryState("id", parseAsString)
  const query = useStaffLesson(id)
  const loaded = query.data !== undefined

  useEffect(() => {
    if (loaded) scrollToHash()
  }, [loaded])

  if (id === null || id === "") {
    return (
      <PageContainer title={t("title")} actions={<BackLink href="/lessons/" label={t("back")} />}>
        <StateView state="empty" emptyText={t("missing")} />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={query.data?.lesson.subject.name ?? t("title")}
      actions={<BackLink href="/lessons/" label={t("back")} />}
    >
      <QueryState query={query} rows={5}>
        {(data) => <LessonDetail data={data} withTeacher />}
      </QueryState>
    </PageContainer>
  )
}
