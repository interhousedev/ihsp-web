"use client"

import { NoStudentRecordNotice } from "../../shared/components/no-student-record-notice"
import { isRecordBlocked, useStudentRecordState } from "../../shared/hooks/use-student-record-state"
import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { LinkButton } from "../../shared/components/link-button"
import { DayGradesTab } from "./day-grades-tab"
import { RatingBookButton } from "./rating-book-button"
import { RatingBookDocument } from "./rating-book-document"
import { RecordBookTab } from "./record-book-tab"
import { SemesterGradesTab } from "./semester-grades-tab"

const TABS = ["day", "semester", "record", "book"] as const

/** Grades (WEB-12–16): `?tab=day|semester|record`. Any other value, such as a removed tab, opens By day. */
function GradesContent() {
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
        <div className="max-w-full overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] md:[mask-image:none]">
          <TabsList className="h-auto min-h-11 w-max min-w-full md:w-fit md:min-w-0">
            {TABS.map((value) => (
              <TabsTrigger key={value} value={value} className="min-h-11 px-3">
                {t(`tabs.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="day" className="pt-3">
          <DayGradesTab />
        </TabsContent>
        <TabsContent value="semester" className="pt-3">
          <SemesterGradesTab />
        </TabsContent>
        <TabsContent value="record" className="pt-3">
          <RecordBookTab />
        </TabsContent>
        <TabsContent value="book" className="pt-3">
          <RatingBookDocument />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}

/** GradesPage; a student without a usable academic record sees the explanation instead of the content. */
export function GradesPage() {
  const t = useT("grades")
  const record = useStudentRecordState()
  if (isRecordBlocked(record.status)) {
    return (
      <PageContainer title={t("title")}>
        <NoStudentRecordNotice reason={record.status} />
      </PageContainer>
    )
  }
  return <GradesContent />
}
