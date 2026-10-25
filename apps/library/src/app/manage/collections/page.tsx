"use client"

import { CollectionsPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** Collections. */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["librarian", "admin"] }}>
      <CollectionsPage />
    </LibraryShell>
  )
}
