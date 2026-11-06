"use client"

import { Suspense } from "react"
import { ActivityPage } from "@/features/connectors/components/activity-page"

export default function Page() {
  return (
    <Suspense>
      <ActivityPage />
    </Suspense>
  )
}
