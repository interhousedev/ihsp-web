"use client"

import { NotificationCenter } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { AdmissionShell } from "../../features/shell/components/admission-shell"

export default function Page() {
  const t = useT("notifications")
  return (
    <AdmissionShell>
      <PageContainer title={t("title")}>
        <NotificationCenter />
      </PageContainer>
    </AdmissionShell>
  )
}
