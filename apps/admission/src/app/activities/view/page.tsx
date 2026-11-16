"use client"

import { Suspense } from "react"
import { ItemEditorPage } from "../../../features/items/components/item-editor"

export default function Page() {
  return (
    <Suspense>
      <ItemEditorPage />
    </Suspense>
  )
}
