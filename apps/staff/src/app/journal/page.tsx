"use client"

import { JournalPage } from "@/features/journal/components/journal-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <JournalPage />
    </StaffShell>
  )
}
