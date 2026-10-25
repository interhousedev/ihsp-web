"use client"

import { MyFeedbackPage } from "@/features/feedback/components/my-feedback-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <MyFeedbackPage />
    </SpShell>
  )
}
