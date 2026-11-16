"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader } from "@ihsp/ui"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { CalendarView } from "./calendar-view"

export function DeadlinesPage() {
  const t = useT("deadlines")
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t("title")} />
        <CalendarView />
      </div>
    </AdmissionShell>
  )
}
