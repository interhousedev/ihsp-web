"use client"

import { AccountPage } from "@/features/profile/components/account-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <AccountPage />
    </SpShell>
  )
}
