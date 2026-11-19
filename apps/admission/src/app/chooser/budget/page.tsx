"use client"

import { Suspense } from "react"
import { BudgetPage } from "../../../features/budget/components/budget-page"
import { ChooserPage } from "../../../features/chooser/components/chooser-page"

export default function Page() {
  return (
    <ChooserPage>
      <Suspense>
        <BudgetPage />
      </Suspense>
    </ChooserPage>
  )
}
