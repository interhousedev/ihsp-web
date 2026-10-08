"use client"

import { CopySharedSet } from "@/features/flashcards/components/copy-shared-set"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <CopySharedSet />
    </SpShell>
  )
}
