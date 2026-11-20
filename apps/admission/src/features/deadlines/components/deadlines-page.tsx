"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"

import { AdmissionShell } from "../../shell/components/admission-shell"
import { CalendarFeed } from "./calendar-feed"
import { DeadlinesGantt } from "./deadlines-gantt"
import { PrefsForm } from "./prefs-form"

export function DeadlinesPage() {
  const t = useT("deadlines")
  const [settings, setSettings] = useState(false)
  return (
    <AdmissionShell>
      <div className={pageClass("min-h-0 flex-1")}>
        <AppPageHeader icon="calendarEvent" title={t("title")} />
        <DeadlinesGantt onSettings={() => setSettings(true)} />
        <ResponsiveDialog open={settings} onOpenChange={setSettings} title={t("prefsTitle")}>
          <div className="flex flex-col gap-4">
            <PrefsForm />
            <CalendarFeed />
          </div>
        </ResponsiveDialog>
      </div>
    </AdmissionShell>
  )
}
