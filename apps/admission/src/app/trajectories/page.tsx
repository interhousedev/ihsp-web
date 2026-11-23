"use client"

import { Suspense } from "react"
import { TrajectoriesPage } from "../../features/trajectories/components/trajectories-page"

export default function Page() {
  return (
    <Suspense>
      <TrajectoriesPage />
    </Suspense>
  )
}
