"use client"

import { Suspense } from "react"
import { ExcusesPage } from "@/features/excuses/components/excuses-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <Suspense>
        <ExcusesPage />
      </Suspense>
    </StaffShell>
  )
}
