"use client"

import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"
import { StudentsPage } from "@/features/students/components/students-page"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <StudentsPage courseId={id} />}</ParamsRoute>
    </LmsShell>
  )
}
