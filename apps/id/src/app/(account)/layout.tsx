"use client"

import { RequireAuth } from "@ihsp/auth"
import type { ReactNode } from "react"
import { AccountShell } from "@/features/account/components/account-shell"

/** The security area: it needs a login as OAuth client `id` and uses the sidebar shell. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AccountShell>{children}</AccountShell>
    </RequireAuth>
  )
}
