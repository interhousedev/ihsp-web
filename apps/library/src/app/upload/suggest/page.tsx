"use client"

import { BookEditor } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** Suggest a book: the book editor in "suggest" mode, sent to the librarians' queue. */
export default function Page() {
  return (
    <LibraryShell access="auth">
      <BookEditor id={null} mode="suggest" />
    </LibraryShell>
  )
}
