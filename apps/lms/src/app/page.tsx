"use client"

import { CatalogPage } from "@/features/catalog/components/catalog-page"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <CatalogPage />
    </LmsShell>
  )
}
