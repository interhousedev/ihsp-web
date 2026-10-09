"use client"

import { StatsPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** Library statistics. */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["librarian", "admin"] }}>
      <StatsPage />
    </LibraryShell>
  )
}
