"use client"

import { MyCoursesPage } from "@/features/courses/components/my-courses-page"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <MyCoursesPage />
    </LmsShell>
  )
}
