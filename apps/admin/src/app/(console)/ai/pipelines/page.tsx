"use client"

import { Suspense } from "react"
import { PipelinesPage } from "@/features/ai-harness/components/pipelines-page"

export default function Page() {
  return (
    <Suspense>
      <PipelinesPage />
    </Suspense>
  )
}
