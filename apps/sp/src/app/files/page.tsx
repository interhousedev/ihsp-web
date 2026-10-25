"use client"

import { FilesPage } from "@/features/files/components/files-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <FilesPage />
    </SpShell>
  )
}
