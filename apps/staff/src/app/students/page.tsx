"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { StudentSearch } from "@/features/students/search"

export default function Page() {
  return (
    <StaffShell>
      <StudentSearch />
    </StaffShell>
  )
}
