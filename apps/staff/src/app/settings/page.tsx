"use client"

import { SettingsPage } from "@/features/settings/components/settings-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <SettingsPage />
    </StaffShell>
  )
}
