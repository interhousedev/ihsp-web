"use client"

import { CoursePage } from "@/features/courses/components/course-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["slug"]}>{({ slug }) => <CoursePage slug={slug} />}</ParamsRoute>
    </LmsShell>
  )
}
