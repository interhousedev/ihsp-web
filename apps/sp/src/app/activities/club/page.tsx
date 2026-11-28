"use client"

import { ClubPage } from "@/features/activities/components/club-page"
import { SpShell } from "@/features/shell/components/sp-shell"
import { Suspense } from "react"

export default function ClubPageRoute() {
  return (
    <SpShell>
      <Suspense>
        <ClubPage />
      </Suspense>
    </SpShell>
  )
}
