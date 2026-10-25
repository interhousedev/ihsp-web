"use client"

import { AssistantPage } from "@/features/assistant/components/assistant-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <AssistantPage />
    </SpShell>
  )
}
