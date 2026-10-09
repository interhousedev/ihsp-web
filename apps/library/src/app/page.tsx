"use client"

import { LibraryHomePage } from "@ihsp/features-core"
import { LibraryShell } from "../features/shell/components/library-shell"

/** Home: search, continue reading, reading for your year, subject shelves, collections, recently added. */
export default function Page() {
  return (
    <LibraryShell access="public">
      <LibraryHomePage />
    </LibraryShell>
  )
}
