"use client"

import { UploadEditPage } from "@ihsp/features-core"
import { LibraryShell } from "../../../features/shell/components/library-shell"

/** Carry on with a draft, fix a rejected or sent-back material, or correct a published one (`?id=`). */
export default function Page() {
  return (
    <LibraryShell access="auth">
      <UploadEditPage />
    </LibraryShell>
  )
}
