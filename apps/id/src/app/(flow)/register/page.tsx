"use client"

import { Suspense } from "react"
import { FlowSkeleton } from "@/features/shared/components/flow-skeleton"
import { RegisterPage } from "@/features/registration/components/register-page"

export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <RegisterPage />
    </Suspense>
  )
}
