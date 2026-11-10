"use client"

import { Suspense } from "react"
import { ExcusesPage } from "@/features/excuses/components/excuses-page"

export default function Page() {
  return (
    <Suspense>
      <ExcusesPage />
    </Suspense>
  )
}
