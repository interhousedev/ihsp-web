"use client"

import { Suspense } from "react"
import { ConnectorActivityPage } from "@ihsp/features-core/id-account"

export default function Page() {
  return (
    <Suspense>
      <ConnectorActivityPage />
    </Suspense>
  )
}
