"use client"

import { LessonPage } from "@/features/lessons/components/lesson-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <LessonPage />
    </SpShell>
  )
}
