"use client"

import { HomeworkPage } from "@/features/homework/components/homework-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <HomeworkPage />
    </StaffShell>
  )
}
