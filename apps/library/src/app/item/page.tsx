"use client"

import { ItemPage } from "@ihsp/features-core"
import { LibraryShell } from "../../features/shell/components/library-shell"

/** An item (`?id=`): a UniLibrary record, a book or a material. Visitors see what the API lets them see. */
export default function Page() {
  return (
    <LibraryShell access="public">
      <ItemPage />
    </LibraryShell>
  )
}
