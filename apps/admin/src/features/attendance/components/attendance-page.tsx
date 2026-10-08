"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { AttendanceReportTab } from "./attendance-report-tab"
import { MissingAttendanceTab } from "./missing-attendance-tab"

const TABS = ["report", "missing"] as const

/** Attendance reports and the missing-attendance list (ADM-12, UF-ADM-09). */
export function AttendancePage() {
  const t = useT("attendance")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("report"))
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <Tabs
        value={tab}
        onValueChange={(value) => void setTab(value === "report" ? null : (value as (typeof TABS)[number]))}
      >
        <TabsList className="w-full justify-start sm:w-fit">
          <TabsTrigger value="report" className="min-h-11 md:min-h-7">
            {t("tabs.report")}
          </TabsTrigger>
          <TabsTrigger value="missing" className="min-h-11 md:min-h-7">
            {t("tabs.missing")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "report" ? <AttendanceReportTab /> : <MissingAttendanceTab />}
    </PageContainer>
  )
}
