"use client"

import { AdmissionShell } from "../../shell/components/admission-shell"
import { PlanBody } from "../../opportunities/components/plan-page"

/** The plan: saved opportunities placed by school grade and term. */
export function PlanPage() {
  return (
    <AdmissionShell>
      <PlanBody />
    </AdmissionShell>
  )
}
