"use client"

import { NotebooksPage } from "@/features/notebooks/components/notebooks-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <NotebooksPage />
    </StaffShell>
  )
}
