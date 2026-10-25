"use client"

import { UploadBookPage } from "@ihsp/features-core"
import { LibraryShell } from "../../features/shell/components/library-shell"

/** Add a book: the book editor; librarians create the book, everyone else sends it as a suggestion. */
export default function Page() {
  return (
    <LibraryShell access="auth">
      <UploadBookPage />
    </LibraryShell>
  )
}
