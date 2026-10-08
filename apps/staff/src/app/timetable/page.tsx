"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { TimetablePage } from "@/features/timetable/components/timetable-page"

export default function Page() {
  return (
    <StaffShell>
      <TimetablePage />
    </StaffShell>
  )
}
