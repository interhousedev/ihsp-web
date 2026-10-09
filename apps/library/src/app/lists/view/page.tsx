"use client"

import { ReadingListPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** One reading list (`?id=`). */
export default function Page() {
  return (
    <LibraryShell access="auth">
      <ReadingListPage />
    </LibraryShell>
  )
}
