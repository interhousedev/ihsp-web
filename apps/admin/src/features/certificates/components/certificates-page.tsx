"use client"

import { CertificatesStaffView } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"

/** Certificates of all students: filters, files to ZIP, stats per type and the ranking. */
export function CertificatesPage() {
  const t = useT("certificates")
  return (
    <PageContainer title={t("title")}>
      <CertificatesStaffView />
    </PageContainer>
  )
}
