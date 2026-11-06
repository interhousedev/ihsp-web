"use client"

import { NotebookJoinPage } from "@ihsp/features-core"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <NotebookJoinPage />
    </StaffShell>
  )
}
