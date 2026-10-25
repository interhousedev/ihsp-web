"use client"

import { StudySession } from "@/features/flashcards/components/study-session"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <StudySession />
    </SpShell>
  )
}
