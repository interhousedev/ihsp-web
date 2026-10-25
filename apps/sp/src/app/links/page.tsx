"use client"

import { LinksPage } from "@/features/links/components/links-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <LinksPage />
    </SpShell>
  )
}
