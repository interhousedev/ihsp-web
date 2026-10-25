"use client"

import { ExamPage } from "@/features/exams/components/exam-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <ExamPage />
    </SpShell>
  )
}
