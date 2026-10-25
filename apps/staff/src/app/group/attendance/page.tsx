"use client"

import { GroupAttendancePage } from "@/features/group/components/group-attendance-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <GroupAttendancePage />
    </StaffShell>
  )
}
