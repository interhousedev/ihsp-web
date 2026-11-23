"use client"

import { ReviewSessionPage } from "@/features/engagement/components/review-session"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ReviewSessionPage />
    </LmsShell>
  )
}
