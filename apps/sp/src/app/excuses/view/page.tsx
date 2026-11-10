"use client"

import { ExcusePage } from "@/features/excuses/components/excuse-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <ExcusePage />
    </SpShell>
  )
}
