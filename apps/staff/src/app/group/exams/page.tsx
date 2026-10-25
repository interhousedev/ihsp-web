"use client"

import { ExamsPage } from "@/features/exams/components/exams-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <ExamsPage />
    </StaffShell>
  )
}
