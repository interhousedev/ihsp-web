"use client"

import { SubjectPage } from "@/features/subjects/components/subject-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <SubjectPage />
    </SpShell>
  )
}
