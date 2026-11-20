"use client"

import { Suspense } from "react"
import { RequestsPage } from "@/features/ai-harness/components/requests-page"

export default function Page() {
  return (
    <Suspense>
      <RequestsPage />
    </Suspense>
  )
}
