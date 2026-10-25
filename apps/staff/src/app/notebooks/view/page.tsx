"use client"

import { NotebookPage } from "@/features/notebooks/components/notebook-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <NotebookPage />
    </StaffShell>
  )
}
