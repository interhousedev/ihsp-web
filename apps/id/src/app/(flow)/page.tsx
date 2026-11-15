"use client"

import { Suspense } from "react"
import { FlowSkeleton } from "@/features/shared/components/flow-skeleton"
import { HomePage } from "@/features/home/components/home-page"

export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <HomePage />
    </Suspense>
  )
}
