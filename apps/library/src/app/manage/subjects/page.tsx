"use client"

import { SubjectsPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** The subject tree: create, rename, nest, reorder and archive subjects. */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["librarian", "admin"] }}>
      <SubjectsPage />
    </LibraryShell>
  )
}
