"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect } from "react"
import { AttendanceSheetView } from "../../attendance/components/attendance-sheet"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { useStaffLesson } from "../hooks/use-staff-lesson"
import { scrollToHash } from "../utils/scroll-to-hash"
import { AttachmentsSection } from "./attachments-section"
import { HomeworkEditor } from "./homework-editor"
import { LessonHeader } from "./lesson-header"
import { MaterialsSection } from "./materials-section"
import { TopicEditor } from "./topic-editor"

/**
 * The lesson page (STF-4, UF-STF-04 to UF-STF-08): audience and room, topic, materials, student attachments,
 * homework and the attendance sheet. `?id=` is the lesson; `?add=material` opens "Add material" and the address hash
 * (`#attendance`, `#homework`, `#materials`) scrolls to a section (the Today quick actions).
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
          <div className="flex flex-col gap-4">
            <LessonHeader lesson={data.lesson} />
            <TopicEditor key={`topic-${data.lesson.id}`} lesson={data.lesson} />
            <MaterialsSection
              lesson={data.lesson}
              materials={data.materials}
              defaultOpen={add === "material"}
              onAddClosed={() => void setAdd(null)}
            />
            <AttachmentsSection lessonId={data.lesson.id} attachments={data.attachments} />
            <HomeworkEditor key={`homework-${data.lesson.id}`} lesson={data.lesson} homework={data.homework} />
            <AttendanceSheetView lesson={data.lesson} sheet={data.attendance} />
          </div>
        )}
      </QueryState>
    </PageContainer>
  )
}
