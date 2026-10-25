"use client"

import { StaffShell } from "@/features/shell/components/staff-shell"
import { GroupPage } from "@/features/subjects/components/group-page"

export default function Page() {
  return (
    <StaffShell>
      <GroupPage />
    </StaffShell>
  )
}
