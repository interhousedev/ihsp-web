"use client"

import { RequireAuth } from "@ihsp/auth"
import { Suspense, type ReactNode } from "react"
import { PageLoading } from "./page-loading"

/**
 * The frame of the lesson player: only the login check. The player draws its own full-screen layout (dark top bar and
 * course sidebar), so it does not sit inside the sidebar shell of the other pages. The `Suspense` covers the pages that
 * read the address.
 */
export function LearnerShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </RequireAuth>
  )
}
