"use client"

import { CallForImprovementsPage } from "@/features/call-for-improvements/components/call-for-improvements-page"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense>
      <CallForImprovementsPage />
    </Suspense>
  )
}
