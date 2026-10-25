"use client"

import { PlannerPage } from "@/features/grades/planner/components/planner-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <PlannerPage />
    </SpShell>
  )
}
