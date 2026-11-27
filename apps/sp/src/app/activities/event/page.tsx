"use client"

import { EventPage } from "@/features/activities/components/event-page"
import { SpShell } from "@/features/shell/components/sp-shell"
import { Suspense } from "react"

export default function EventPageRoute() {
  return (
    <SpShell>
      <Suspense>
        <EventPage />
      </Suspense>
    </SpShell>
  )
}
