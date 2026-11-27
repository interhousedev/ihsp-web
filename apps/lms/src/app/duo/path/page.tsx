"use client"

import { Suspense } from "react"
import { MasteryPath } from "@/features/duo-coach/mastery-path"
import { LmsShell } from "@/features/shell/components/lms-shell"

/** Mockup: the Duo course path with one continuous line. `?course=` picks a demo course of each type. */
export default function Page() {
  return (
    <LmsShell access="public">
      <Suspense fallback={null}>
        <MasteryPath />
      </Suspense>
    </LmsShell>
  )
}
