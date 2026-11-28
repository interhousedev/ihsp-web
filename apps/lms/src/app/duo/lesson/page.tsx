"use client"

import { Suspense } from "react"
import { DuoLesson } from "@/features/duo-coach/duo-lesson"

/** Mockup: the Duo lesson. A test step opens the AI Coach lesson; every other step type has its own player. */
export default function Page() {
  return (
    <div data-skin="playful" style={{ background: "var(--pl-bg)" }}>
      <Suspense fallback={null}>
        <DuoLesson />
      </Suspense>
    </div>
  )
}
