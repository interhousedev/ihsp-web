"use client"

import { SubgroupsPage } from "@/features/group/components/subgroups-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <SubgroupsPage />
    </StaffShell>
  )
}
