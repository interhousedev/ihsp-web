"use client"

import { LessonPage } from "@/features/lessons/components/lesson-page"
import { StaffShell } from "@/features/shell/components/staff-shell"
import { Suspense } from "react"

export default function Page() {
  return (
    <StaffShell>
      <Suspense>
        <LessonPage />
      </Suspense>
    </StaffShell>
  )
}
