"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { SubjectPage } from "@/features/subjects/components/subject-page"

export default function Page() {
  return (
    <StaffShell>
      <SubjectPage />
    </StaffShell>
  )
}
