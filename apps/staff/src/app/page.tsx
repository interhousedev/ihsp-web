"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { TodayPage } from "@/features/today/components/today-page"

export default function Page() {
  return (
    <StaffShell>
      <TodayPage />
    </StaffShell>
  )
}
