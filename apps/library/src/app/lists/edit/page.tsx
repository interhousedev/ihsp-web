"use client"

import { ReadingListEditor } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** The reading-list editor for teachers, librarians and administrators; a new list without `?id=`. */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["teacher", "librarian", "admin"] }}>
      <ReadingListEditor />
    </LibraryShell>
  )
}
