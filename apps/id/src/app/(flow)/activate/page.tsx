"use client"

import { Suspense } from "react"
import { FlowSkeleton } from "@/features/shared/components/flow-skeleton"
import { ActivatePage } from "@/features/activation/components/activate-page"

export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <ActivatePage />
    </Suspense>
  )
}
