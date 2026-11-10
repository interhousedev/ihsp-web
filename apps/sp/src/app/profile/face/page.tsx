"use client"

import { FacePage } from "@/features/face/components/face-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <FacePage />
    </SpShell>
  )
}
