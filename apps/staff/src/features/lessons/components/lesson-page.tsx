"use client"

import { LessonDetail, scrollToHash, useStaffLesson } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect } from "react"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { TemporaryMarksSection } from "./temporary-marks-section"

/**
 * The lesson page (STF-4, UF-STF-04 to UF-STF-08): audience and room, topic, materials, student attachments,
 * homework and the attendance sheet (shared with the admin app, `LessonDetail`). `?id=` is the lesson; `?add=material`
 * opens "Add material" and the address hash (`#attendance`, `#homework`, `#materials`) scrolls to a section (the Today
 * quick actions).
 */
export function LessonPage() {
  const t = useT("lesson")
  const [id] = useQueryState("id", parseAsString)
  const [add, setAdd] = useQueryState("add", parseAsString)
  const query = useStaffLesson(id)
  const loaded = query.data !== undefined

  useEffect(() => {
    if (loaded) scrollToHash()
  }, [loaded])

  if (id === null || id === "") {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("missing")} />
      </PageContainer>
    )
  }

  return (
    <PageContainer title={query.data?.lesson.subject.name ?? t("title")}>
      <BackLink href="/timetable/" label={t("backToTimetable")} />
      <QueryState query={query} rows={5}>
        {(data) => (
          <>
            <LessonDetail
              data={data}
              addMaterialOpen={add === "material"}
              onAddMaterialClosed={() => void setAdd(null)}
            />
            <TemporaryMarksSection lessonId={data.lesson.id} roster={data.attendance.roster} />
          </>
        )}
      </QueryState>
    </PageContainer>
  )
}
