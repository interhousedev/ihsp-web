"use client"

import { QueuePage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** The review queue (`?tab=`): tabs, split view, reason dialogs and keyboard shortcuts. */
export default function Page() {
  return (
    <LibraryShell access={{ roles: ["librarian", "admin"] }}>
      <QueuePage />
    </LibraryShell>
  )
}
