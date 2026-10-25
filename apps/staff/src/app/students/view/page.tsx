"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { StudentProfile } from "@/features/students/student-profile"

export default function Page() {
  return (
    <StaffShell>
      <StudentProfile />
    </StaffShell>
  )
}
