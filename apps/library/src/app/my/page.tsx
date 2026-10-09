"use client"

import { MyLibraryPage } from "@ihsp/features-core"
import { LibraryShell } from "../../features/shell/components/library-shell"

/** My library (`?tab=continue|shelf|notes|lists|uploads`): signed-in users only. */
export default function Page() {
  return (
    <LibraryShell access="auth">
      <MyLibraryPage />
    </LibraryShell>
  )
}
