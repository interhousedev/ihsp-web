"use client"

import { HomeworkPage } from "@/features/homework/components/homework-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <HomeworkPage />
    </SpShell>
  )
}
