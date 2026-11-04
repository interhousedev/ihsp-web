"use client"

import { LibraryHomePage } from "@ihsp/features-core"
import { LibraryShell } from "../features/shell/components/library-shell"

/**
 * Home for everyone. A signed-in user also gets continue reading and reading for the year; a visitor gets the subject
 * shelves, collections and recent items, which the home endpoints serve anonymously.
 */
export default function Page() {
  return (
    <LibraryShell access="public">
      <LibraryHomePage />
    </LibraryShell>
  )
}
