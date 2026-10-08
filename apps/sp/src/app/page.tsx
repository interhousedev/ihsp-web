"use client"

import { TodayPage } from "@/features/today/components/today-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <TodayPage />
    </SpShell>
  )
}
