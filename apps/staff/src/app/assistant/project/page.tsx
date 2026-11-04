"use client"

import { AssistantPage } from "@/features/assistant/components/assistant-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <AssistantPage />
    </StaffShell>
  )
}
