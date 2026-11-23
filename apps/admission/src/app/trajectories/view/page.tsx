"use client"

import { Suspense } from "react"
import { TrajectoryPage } from "../../../features/trajectories/components/trajectory-page"

export default function Page() {
  return (
    <Suspense>
      <TrajectoryPage />
    </Suspense>
  )
}
