"use client"

import { Suspense } from "react"
import { WordsPage } from "../../features/words/components/words-page"

export default function Page() {
  return (
    <Suspense>
      <WordsPage />
    </Suspense>
  )
}
