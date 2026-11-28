"use client"

import { RatingPage } from "@/features/rating/components/rating-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <RatingPage />
    </SpShell>
  )
}
