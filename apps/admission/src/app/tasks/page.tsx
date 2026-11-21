"use client"

import { Suspense } from "react"
import { TasksPage } from "../../features/tasks/components/tasks-page"

export default function Page() {
  return (
    <Suspense>
      <TasksPage />
    </Suspense>
  )
}
