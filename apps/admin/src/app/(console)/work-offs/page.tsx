"use client"

import { Suspense } from "react"
import { WorkOffsPage } from "@/features/work-offs/components/work-offs-page"

export default function Page() {
  return (
    <Suspense>
      <WorkOffsPage />
    </Suspense>
  )
}
