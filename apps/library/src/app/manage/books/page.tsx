"use client"

import { BooksPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** The books table with search, status filter and bulk import. */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["librarian", "admin"] }}>
      <BooksPage />
    </LibraryShell>
  )
}
