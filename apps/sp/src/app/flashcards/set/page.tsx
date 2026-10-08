"use client"

import { FlashcardSetPage } from "@/features/flashcards/components/flashcard-set-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <FlashcardSetPage />
    </SpShell>
  )
}
