"use client"

import { Suspense } from "react"
import { ItemListPage } from "../../features/items/components/item-list"

export default function Page() {
  return (
    <Suspense>
      <ItemListPage />
    </Suspense>
  )
}
