"use client"

import { FeedbackDetailPage } from "@/features/call-for-improvements/components/feedback-detail-page"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense>
      <FeedbackDetailPage />
    </Suspense>
  )
}
