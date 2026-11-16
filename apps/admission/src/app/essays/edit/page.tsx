"use client"

import { Suspense } from "react"
import { EssayEditorPage } from "../../../features/essays/components/essay-editor"

export default function Page() {
  return (
    <Suspense>
      <EssayEditorPage />
    </Suspense>
  )
}
