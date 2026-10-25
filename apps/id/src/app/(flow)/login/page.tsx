"use client"

import { Suspense } from "react"
import { FlowSkeleton } from "@/features/shared/components/flow-skeleton"
import { LoginPage } from "@/features/login/components/login-page"

export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <LoginPage />
    </Suspense>
  )
}
