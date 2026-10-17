"use client"

import { CertificatesPage } from "@/features/certificates/certificates-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <CertificatesPage />
    </StaffShell>
  )
}
