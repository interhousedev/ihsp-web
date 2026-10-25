"use client"

import { SpShell } from "@/features/shell/components/sp-shell"
import { TeacherPage } from "@/features/teachers/components/teacher-page"

export default function Page() {
  return (
    <SpShell>
      <TeacherPage />
    </SpShell>
  )
}
