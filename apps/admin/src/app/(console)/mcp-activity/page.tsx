"use client"

import { Suspense } from "react"
import { McpActivityPage } from "@/features/mcp-activity/components/mcp-activity-page"

export default function Page() {
  return (
    <Suspense>
      <McpActivityPage />
    </Suspense>
  )
}
