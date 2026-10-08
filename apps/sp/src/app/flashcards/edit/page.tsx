"use client"

import { CardEditor } from "@/features/flashcards/components/card-editor"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <CardEditor />
    </SpShell>
  )
}
