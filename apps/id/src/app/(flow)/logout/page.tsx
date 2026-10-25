"use client"

import { Suspense } from "react"
import { FlowSkeleton } from "@/features/shared/components/flow-skeleton"
import { LogoutPage } from "@/features/logout/components/logout-page"

export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <LogoutPage />
    </Suspense>
  )
}
