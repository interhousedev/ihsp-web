"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { LinkButton } from "../../shared/components/link-button"
import { DayGradesTab } from "./day-grades-tab"
import { RatingBookButton } from "./rating-book-button"
import { RecordBookTab } from "./record-book-tab"
import { SemesterGradesTab } from "./semester-grades-tab"

const TABS = ["day", "semester", "record"] as const

/** Grades (WEB-12–16): `?tab=day|semester|record`. Any other value, such as a removed tab, opens By day. */
export function GradesPage() {
  const t = useT("grades")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("day"))
  return (
    <PageContainer
      title={t("title")}
      actions={
        <>
          <LinkButton href="/honours/">{t("honoursLink")}</LinkButton>
          <RatingBookButton />
        </>
      }
    >
      <Tabs value={tab} onValueChange={(value) => void setTab(TABS.find((item) => item === value) ?? "day")}>
        <TabsList className="h-auto min-h-11 w-full md:w-fit">
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value} className="min-h-11 px-3">
              {t(`tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="day" className="pt-3">
          <DayGradesTab />
        </TabsContent>
        <TabsContent value="semester" className="pt-3">
          <SemesterGradesTab />
        </TabsContent>
        <TabsContent value="record" className="pt-3">
          <RecordBookTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
