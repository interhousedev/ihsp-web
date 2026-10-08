"use client"

import { Suspense } from "react"
import { FlowSkeleton } from "@/features/shared/components/flow-skeleton"
import { OtpLoginPage } from "@/features/otp-login/components/otp-login-page"

export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <OtpLoginPage />
    </Suspense>
  )
}
