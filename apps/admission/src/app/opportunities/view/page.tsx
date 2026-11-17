"use client"

import { Suspense } from "react"
import { OpportunityDetailPage } from "../../../features/opportunities/components/opportunity-detail-page"

export default function Page() {
  return (
    <Suspense>
      <OpportunityDetailPage />
    </Suspense>
  )
}
