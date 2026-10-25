"use client"

import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { LearnerShell } from "../../shell/components/learner-shell"
import { LmsShell } from "../../shell/components/lms-shell"

/**
 * A preview of one step uses the full-screen lesson player like learners do; the list of steps to preview stays in
 * the sidebar shell. Must render inside a `Suspense` (it reads the address).
 */
export function PreviewShell({ children }: { children: ReactNode }) {
  const step = useSearchParams().get("step")
  return step ? <LearnerShell>{children}</LearnerShell> : <LmsShell>{children}</LmsShell>
}
