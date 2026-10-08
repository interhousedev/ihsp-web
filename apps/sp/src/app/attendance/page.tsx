"use client"

import { AttendancePage } from "@/features/attendance/components/attendance-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <AttendancePage />
    </SpShell>
  )
}
