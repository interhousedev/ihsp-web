"use client"

import type { StaffLesson } from "@ihsp/api"
import { AttachmentsSection } from "./attachments-section"
import { AttendanceSheetView } from "./attendance-sheet"
import { HomeworkEditor } from "./homework-editor"
import { LessonHeader } from "./lesson-header"
import { MaterialsSection } from "./materials-section"
import { TopicEditor } from "./topic-editor"

/**
 * Everything on a lesson page below the title (STF-4, UF-STF-04 to UF-STF-08, ADM-10): header, topic, materials,
 * student attachments, homework and the attendance sheet. The staff app and the admin app render the same sections;
 * what each role may change is decided by the backend (`attendance.editable`, the author or admin rule of resources).
 * `withTeacher` adds the subject and the teacher to the header (Administration); `addMaterialOpen` opens "Add material"
 * at once (the Today quick action).
 */
export function LessonDetail({
  data,
  withTeacher = false,
  addMaterialOpen = false,
  onAddMaterialClosed,
}: {
  data: StaffLesson
  withTeacher?: boolean
  addMaterialOpen?: boolean
  onAddMaterialClosed?: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <LessonHeader lesson={data.lesson} withTeacher={withTeacher} />
      <TopicEditor key={`topic-${data.lesson.id}`} lesson={data.lesson} />
      <MaterialsSection
        lesson={data.lesson}
        materials={data.materials}
        defaultOpen={addMaterialOpen}
        onAddClosed={() => onAddMaterialClosed?.()}
      />
      <AttachmentsSection lessonId={data.lesson.id} attachments={data.attachments} />
      <HomeworkEditor key={`homework-${data.lesson.id}`} lesson={data.lesson} homework={data.homework} />
      <AttendanceSheetView lesson={data.lesson} sheet={data.attendance} />
    </div>
  )
}
