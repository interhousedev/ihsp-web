"use client"

import { LessonPage } from "@/features/lessons/components/lesson-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <LessonPage />
    </StaffShell>
  )
}
