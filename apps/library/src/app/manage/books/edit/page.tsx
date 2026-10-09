"use client"

import { BookEditorPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../../features/shell/components/library-shell"

/** The book editor (`?id=`; a new book without it, `?title=` prefills the title). */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["librarian", "admin"] }}>
      <BookEditorPage />
    </LibraryShell>
  )
}
