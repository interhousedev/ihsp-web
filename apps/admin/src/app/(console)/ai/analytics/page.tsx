"use client"

import { Suspense } from "react"
import { AnalyticsPage } from "@/features/ai-harness/components/analytics-page"

export default function Page() {
  return (
    <Suspense>
      <AnalyticsPage />
    </Suspense>
  )
}
