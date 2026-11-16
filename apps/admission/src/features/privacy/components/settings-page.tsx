"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader } from "@ihsp/ui"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { AuditList } from "./audit-list"
import { DataControls } from "./data-controls"
import { PurposeConsents } from "./purpose-consents"

/** Settings: purpose consents, data export and erasure, and the access log. */
export function SettingsPage() {
  const t = useT("privacy")
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 md:p-6">
        <PageHeader title={t("title")} />
        <PurposeConsents />
        <DataControls />
        <AuditList />
      </div>
    </AdmissionShell>
  )
}
