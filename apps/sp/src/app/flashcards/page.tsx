"use client"

import { FlashcardSetsPage } from "@/features/flashcards/components/flashcard-sets-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <FlashcardSetsPage />
    </SpShell>
  )
}
