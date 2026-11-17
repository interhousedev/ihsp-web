"use client"

import { AppPageHeader, PageSection, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"

import { AdmissionShell } from "../../shell/components/admission-shell"
import { CalendarView } from "./calendar-view"
import { PrepGantt } from "./prep-gantt"

export function DeadlinesPage() {
  const t = useT("deadlines")
  return (
    <AdmissionShell>
      <div className={pageClass("wide")}>
        <AppPageHeader icon="calendarEvent" title={t("title")} />
        <PageSection title={t("gantt.title")}>
          <PrepGantt />
        </PageSection>
        <div className="mx-auto w-full max-w-3xl">
          <CalendarView />
        </div>
      </div>
    </AdmissionShell>
  )
}
