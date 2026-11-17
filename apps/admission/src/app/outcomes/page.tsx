"use client"

import { Suspense } from "react"
import { OutcomesPage } from "../../features/outcomes/components/outcomes-page"

export default function Page() {
  return (
    <Suspense>
      <OutcomesPage />
    </Suspense>
  )
}
