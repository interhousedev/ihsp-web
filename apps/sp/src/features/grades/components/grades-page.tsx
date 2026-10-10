"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { DayGradesTab } from "./day-grades-tab"
import { RecordBookTab } from "./record-book-tab"
import { SemesterGradesTab } from "./semester-grades-tab"

const TABS = ["semester", "day", "record"] as const

/** Grades (WEB-12–16): `?tab=semester|day|record`. */
export function GradesPage() {
  const t = useT("grades")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("semester"))
  return (
    <PageContainer title={t("title")}>
      <Tabs value={tab} onValueChange={(value) => void setTab(TABS.find((item) => item === value) ?? "semester")}>
        <TabsList className="h-auto min-h-11 w-full md:w-fit">
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value} className="min-h-11 px-3">
              {t(`tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="semester" className="pt-3">
          <SemesterGradesTab />
        </TabsContent>
        <TabsContent value="day" className="pt-3">
          <DayGradesTab />
        </TabsContent>
        <TabsContent value="record" className="pt-3">
          <RecordBookTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
