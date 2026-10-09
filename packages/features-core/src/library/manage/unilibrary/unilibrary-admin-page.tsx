"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { IconInfoCircle } from "@tabler/icons-react"
import { SanctionsForm } from "./sanctions-form"
import { SettingsPanel } from "./settings-panel"
import { StatusPanel } from "./status-panel"

/**
 * `/manage/unilibrary/` (administration only): the switches that turn the dormant UniLibrary source on, its status
 * (breaker, last calls, cache, hidden records) and the sanctions form. Feeds and the subject-to-field mapping are not
 * built yet; the API functions exist, so only a note stands in their place.
 */
export function UniLibraryAdminPage() {
  const t = useT("library.manage.unilibrary")
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <div className="flex max-w-4xl flex-col gap-6">
        <SettingsPanel />
        <StatusPanel />
        <p role="note" className="bg-muted flex items-start gap-2 rounded-xl border p-4 text-sm">
          <IconInfoCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">{t("coming.title")}</span> {t("coming.text")}
          </span>
        </p>
        <SanctionsForm />
      </div>
    </PageContainer>
  )
}
