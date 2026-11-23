"use client"

import { Suspense } from "react"
import { StaffTrajectoriesPage } from "../../../features/trajectories/components/staff-trajectories-page"

export default function Page() {
  return (
    <Suspense>
      <StaffTrajectoriesPage />
    </Suspense>
  )
}
