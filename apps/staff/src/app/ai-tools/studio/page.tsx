"use client"

import { StudioPage } from "@/features/ai-tools/components/studio-page"
import { StaffShell } from "@/features/shell/components/staff-shell"
import { Suspense } from "react"

export default function Page() {
  return (
    <StaffShell>
      <Suspense>
        <StudioPage />
      </Suspense>
    </StaffShell>
  )
}
