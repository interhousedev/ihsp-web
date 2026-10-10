"use client"

import { CourseNotebookPage } from "@/features/notebooks/components/course-notebook-page"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <CourseNotebookPage />
    </LmsShell>
  )
}
