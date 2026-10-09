"use client"

import { TopicsPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** Topics per subject. */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["librarian", "admin"] }}>
      <TopicsPage />
    </LibraryShell>
  )
}
