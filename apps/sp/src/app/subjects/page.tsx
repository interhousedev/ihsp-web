"use client"

import { SubjectsPage } from "@/features/subjects/components/subjects-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <SubjectsPage />
    </SpShell>
  )
}
