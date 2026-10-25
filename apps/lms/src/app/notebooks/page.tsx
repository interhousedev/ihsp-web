"use client"

import { CourseNotebooksPage } from "@/features/notebooks/components/course-notebooks-page"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <CourseNotebooksPage />
    </LmsShell>
  )
}
