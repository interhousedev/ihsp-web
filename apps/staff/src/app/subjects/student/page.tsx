"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { StudentPage } from "@/features/subjects/components/student-page"

export default function Page() {
  return (
    <StaffShell>
      <StudentPage />
    </StaffShell>
  )
}
