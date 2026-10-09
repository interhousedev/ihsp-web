"use client"

import { CollectionPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** A librarian-curated collection (`?id=`). */
export default function Page() {
  return (
    <LibraryShell access="public">
      <CollectionPage />
    </LibraryShell>
  )
}
