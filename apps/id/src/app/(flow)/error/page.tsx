"use client"

import { Suspense } from "react"
import { OAuthErrorPage } from "@/features/oauth-error/components/oauth-error-page"
import { FlowSkeleton } from "@/features/shared/components/flow-skeleton"

export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <OAuthErrorPage />
    </Suspense>
  )
}
