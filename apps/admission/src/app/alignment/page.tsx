"use client"

import { Suspense } from "react"
import { AlignmentPage } from "../../features/alignment/components/alignment-page"

export default function Page() {
  return (
    <Suspense>
      <AlignmentPage />
    </Suspense>
  )
}
