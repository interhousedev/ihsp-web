"use client"

import { StudentsPage } from "@/features/group/components/students-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <StudentsPage />
    </StaffShell>
  )
}
