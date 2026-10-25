"use client"

import { NotebookPage } from "../../../features/notebooks/components/notebook-page"
import { SpShell } from "../../../features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell hideBottomNav>
      <NotebookPage />
    </SpShell>
  )
}
