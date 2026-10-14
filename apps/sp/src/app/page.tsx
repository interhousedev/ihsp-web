"use client"

import { DashboardPage } from "@/features/dashboard/components/dashboard-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <DashboardPage />
    </SpShell>
  )
}
