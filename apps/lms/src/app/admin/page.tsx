"use client"

import { RequireRole } from "@ihsp/auth"
import { AdminPage } from "@/features/admin/components/admin-page"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      {/* oxlint-disable-next-line jsx-a11y/aria-role -- `role` is the app role the user needs, not an ARIA role */}
      <RequireRole role="lms_admin">
        <AdminPage />
      </RequireRole>
    </LmsShell>
  )
}
