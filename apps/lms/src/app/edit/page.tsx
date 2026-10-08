"use client"

import { CourseEditorPage } from "@/features/editor/components/course-editor-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <CourseEditorPage courseId={id} />}</ParamsRoute>
    </LmsShell>
  )
}
