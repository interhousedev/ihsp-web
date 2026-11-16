"use client"

import { Suspense } from "react"
import { SetupWizard } from "../../features/profile/components/setup-wizard"

export default function Page() {
  return (
    <Suspense>
      <SetupWizard />
    </Suspense>
  )
}
