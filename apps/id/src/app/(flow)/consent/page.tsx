"use client"

import { Suspense } from "react"
import { FlowSkeleton } from "@/features/shared/components/flow-skeleton"
import { ConsentPage } from "@/features/consent/components/consent-page"

export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <ConsentPage />
    </Suspense>
  )
}
