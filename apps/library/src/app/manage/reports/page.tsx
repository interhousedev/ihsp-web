"use client"

import { ReportsPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** Reported items and the resolve dialog. */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["librarian", "admin"] }}>
      <ReportsPage />
    </LibraryShell>
  )
}
