"use client"

import { ToolPage } from "@/features/ai-tools/components/tool-page"
import { StaffShell } from "@/features/shell/components/staff-shell"
import { Suspense } from "react"

export default function Page() {
  return (
    <StaffShell>
      <Suspense>
        <ToolPage />
      </Suspense>
    </StaffShell>
  )
}
