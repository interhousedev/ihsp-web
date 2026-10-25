"use client"

import { BrowsePage } from "@ihsp/features-core"
import { LibraryShell } from "../../features/shell/components/library-shell"

/** Search and filters; the source chips, sort and layout live in the address. */
export default function Page() {
  return (
    <LibraryShell access="public">
      <BrowsePage />
    </LibraryShell>
  )
}
