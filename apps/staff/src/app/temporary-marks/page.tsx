"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { TemporaryMarksPage } from "@/features/temporary-marks/components/temporary-marks-page"

export default function Page() {
  return (
    <StaffShell>
      <TemporaryMarksPage />
    </StaffShell>
  )
}
