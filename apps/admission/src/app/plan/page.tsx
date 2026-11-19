"use client"

import { Suspense } from "react"
import { PlanPage } from "../../features/items/components/plan-page"

export default function Page() {
  return (
    <Suspense>
      <PlanPage />
    </Suspense>
  )
}
