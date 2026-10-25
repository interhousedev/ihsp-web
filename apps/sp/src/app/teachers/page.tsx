"use client"

import { SpShell } from "@/features/shell/components/sp-shell"
import { TeachersPage } from "@/features/teachers/components/teachers-page"

export default function Page() {
  return (
    <SpShell>
      <TeachersPage />
    </SpShell>
  )
}
