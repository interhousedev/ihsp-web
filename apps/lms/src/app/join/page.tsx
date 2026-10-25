"use client"

import { JoinPage } from "@/features/courses/components/join-page"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <JoinPage />
    </LmsShell>
  )
}
