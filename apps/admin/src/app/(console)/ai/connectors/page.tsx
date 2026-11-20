"use client"

import { Suspense } from "react"
import { ConnectorsPage } from "@/features/ai-harness/components/connectors-page"

export default function Page() {
  return (
    <Suspense>
      <ConnectorsPage />
    </Suspense>
  )
}
