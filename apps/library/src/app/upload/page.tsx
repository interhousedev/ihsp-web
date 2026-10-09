"use client"

import { UploadPage } from "@ihsp/features-core"
import { LibraryShell } from "../../features/shell/components/library-shell"

/** Add a material: the upload wizard (teachers and students). */
export default function Page() {
  return (
    <LibraryShell access="auth">
      <UploadPage />
    </LibraryShell>
  )
}
