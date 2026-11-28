"use client"

import { ManagePage } from "@/features/activities/components/manage-page"
import { SpShell } from "@/features/shell/components/sp-shell"
import { Suspense } from "react"

export default function ManagePageRoute() {
  return (
    <SpShell>
      <Suspense>
        <ManagePage />
      </Suspense>
    </SpShell>
  )
}
