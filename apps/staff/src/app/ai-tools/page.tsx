"use client"

import { AiToolsPage } from "@/features/ai-tools/components/ai-tools-page"
import { StaffShell } from "@/features/shell/components/staff-shell"
import { Suspense } from "react"

export default function Page() {
  return (
    <StaffShell>
      <Suspense>
        <AiToolsPage />
      </Suspense>
    </StaffShell>
  )
}
