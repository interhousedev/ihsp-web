"use client"

import { UniLibraryAdminPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** UniLibrary administration (admin only; UniLibrary is dormant until it is switched on here). */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["admin"] }}>
      <UniLibraryAdminPage />
    </LibraryShell>
  )
}
