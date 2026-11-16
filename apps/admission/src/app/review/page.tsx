"use client"

import { Suspense } from "react"
import { AppReviewPage } from "../../features/app-review/components/app-review-page"

export default function Page() {
  return (
    <Suspense>
      <AppReviewPage />
    </Suspense>
  )
}
