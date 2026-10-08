"use client"

import { TimetablePage } from "@/features/timetable/components/timetable-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <TimetablePage />
    </SpShell>
  )
}
