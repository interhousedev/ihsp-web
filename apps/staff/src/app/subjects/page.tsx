"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { SubjectsPage } from "@/features/subjects/components/subjects-page"

export default function Page() {
  return (
    <StaffShell>
      <SubjectsPage />
    </StaffShell>
  )
}
