"use client"
import { LegalGate } from "@ihsp/features-core"

import { AccessGate, type Access } from "./access-gate"
import { Suspense, type ReactNode } from "react"
import { PageLoading } from "@ihsp/features-core"

/**
 * The frame of the lesson player: only the login check. The player draws its own full-screen layout (dark top bar and
 * course sidebar), so it does not sit inside the sidebar shell of the other pages. The `Suspense` covers the pages that
 * read the address.
 */
export function LearnerShell({ children, access = "auth" }: { children: ReactNode; access?: Access }) {
  return (
    <AccessGate access={access}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
      <LegalGate />
    </AccessGate>
  )
}
