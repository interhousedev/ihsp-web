"use client"

import { Suspense } from "react"
import { PromptsPage } from "@/features/prompts/components/prompts-page"

export default function Page() {
  return (
    <Suspense>
      <PromptsPage />
    </Suspense>
  )
}
