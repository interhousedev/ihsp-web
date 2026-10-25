"use client"

import { ExamsPage } from "@/features/exams/components/exams-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <ExamsPage />
    </SpShell>
  )
}
