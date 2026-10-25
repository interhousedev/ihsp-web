"use client"

import { ReadingListsPage } from "@ihsp/features-core"
import { LibraryShell } from "../../features/shell/components/library-shell"

/** Reading lists of my groups or subjects. */
export default function Page() {
  return (
    <LibraryShell access="auth">
      <ReadingListsPage />
    </LibraryShell>
  )
}
