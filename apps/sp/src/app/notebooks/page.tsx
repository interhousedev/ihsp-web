"use client"

import { NotebooksPage } from "../../features/notebooks/components/notebooks-page"
import { SpShell } from "../../features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <NotebooksPage />
    </SpShell>
  )
}
