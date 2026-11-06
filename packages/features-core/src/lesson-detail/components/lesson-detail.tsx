"use client"

import type { StaffLesson } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { AddMaterialDialog } from "./add-material-dialog"
import { AttachmentsSection } from "./attachments-section"
import { AttendanceSheetView } from "./attendance-sheet"
import { HomeworkEditor } from "./homework-editor"
import { LessonHeader } from "./lesson-header"
import { MaterialsSection } from "./materials-section"
import { TopicEditor } from "./topic-editor"

type PopUp = "homework" | "attendance"

/**
 * Everything on a lesson page below the title (STF-4, UF-STF-04 to UF-STF-08, ADM-10): header, topic, materials,
 * student attachments, and the three actions. Homework and Attendance open in their own pop-up dialogs, Add material
 * too; nothing navigates, the address stays the same. `#homework` and `#attendance` in the address (the Today quick
 * actions) open the matching pop-up at once. `withTeacher` adds the subject and the teacher to the header
 * (Administration); `addMaterialOpen` opens "Add material" at once.
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
  const t = useT("lessonDetail")
  const [popUp, setPopUp] = useState<PopUp | null>(null)

  useEffect(() => {
    if (window.location.hash === "#homework") setPopUp("homework")
    if (window.location.hash === "#attendance") setPopUp("attendance")
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <LessonHeader lesson={data.lesson} withTeacher={withTeacher} />
      <TopicEditor key={`topic-${data.lesson.id}`} lesson={data.lesson} />
      <div role="group" aria-label={t("actions")} className="flex flex-wrap gap-2">
        <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => setPopUp("homework")}>
          {t("homework.title")}
        </Button>
        <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => setPopUp("attendance")}>
          {t("attendance.title")}
        </Button>
        <AddMaterialDialog
          key={`add-${data.lesson.id}`}
          lesson={data.lesson}
          defaultOpen={addMaterialOpen}
          onClose={() => onAddMaterialClosed?.()}
        />
      </div>
      <MaterialsSection lesson={data.lesson} materials={data.materials} />
      <AttachmentsSection lessonId={data.lesson.id} attachments={data.attachments} />

      <ResponsiveDialog
        open={popUp === "homework"}
        onOpenChange={(open) => !open && setPopUp(null)}
        size="lg"
        title={t("homework.title")}
      >
        <HomeworkEditor key={`homework-${data.lesson.id}`} lesson={data.lesson} homework={data.homework} />
      </ResponsiveDialog>
      <ResponsiveDialog
        open={popUp === "attendance"}
        onOpenChange={(open) => !open && setPopUp(null)}
        size="lg"
        title={t("attendance.title")}
      >
        <AttendanceSheetView lesson={data.lesson} sheet={data.attendance} />
      </ResponsiveDialog>
    </div>
  )
}
