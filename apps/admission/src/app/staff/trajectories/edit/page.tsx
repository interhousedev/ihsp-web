"use client"

import { Suspense } from "react"
import { TrajectoryEditorPage } from "../../../../features/trajectories/components/trajectory-editor"

export default function Page() {
  return (
    <Suspense>
      <TrajectoryEditorPage />
    </Suspense>
  )
}
