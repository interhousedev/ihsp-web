"use client"

import { BankPage } from "@/features/ai-tools/components/bank-page"
import { StaffShell } from "@/features/shell/components/staff-shell"
import { Suspense } from "react"

export default function Page() {
  return (
    <StaffShell>
      <Suspense>
        <BankPage />
      </Suspense>
    </StaffShell>
  )
}
