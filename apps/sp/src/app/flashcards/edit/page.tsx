"use client"

import { CardEditorPage } from "@/features/flashcards/components/card-editor-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <CardEditorPage />
    </SpShell>
  )
}
