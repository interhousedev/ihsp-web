"use client"

import { CertificatesStaffView } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"

/** Certificates of the curated groups (a teacher without a group gets a short notice from the shared view). */
export function CertificatesPage() {
  const t = useT("certificates")
  return (
    <PageContainer title={t("staffTitle")}>
      <CertificatesStaffView />
    </PageContainer>
  )
}
