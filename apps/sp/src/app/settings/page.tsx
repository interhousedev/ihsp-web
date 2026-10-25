"use client"

import { SettingsPage } from "@/features/settings/components/settings-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <SettingsPage />
    </SpShell>
  )
}
