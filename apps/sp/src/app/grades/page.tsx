"use client"

import { GradesPage } from "@/features/grades/components/grades-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <GradesPage />
    </SpShell>
  )
}
