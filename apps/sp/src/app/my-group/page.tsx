"use client"

import { MyGroupPage } from "@/features/my-group/components/my-group-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <MyGroupPage />
    </SpShell>
  )
}
