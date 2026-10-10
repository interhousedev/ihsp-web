"use client"

import { BrowsePage, LibraryHomePage, useLibraryAccess } from "@ihsp/features-core"
import { LibraryShell } from "../features/shell/components/library-shell"

/**
 * Home. A signed-in user gets the personal home (continue reading, reading for your year, shelves); an anonymous
 * visitor, and anyone while the silent sign-in is still running, lands on the catalogue itself.
 */
function Landing() {
  const { status } = useLibraryAccess()
  return status === "authenticated" ? <LibraryHomePage /> : <BrowsePage />
}

export default function Page() {
  return (
    <LibraryShell access="public">
      <Landing />
    </LibraryShell>
  )
}
