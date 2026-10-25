"use client"

import { KnowledgePage } from "@/features/knowledge/components/knowledge-page"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense>
      <KnowledgePage />
    </Suspense>
  )
}
