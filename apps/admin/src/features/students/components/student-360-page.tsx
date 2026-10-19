"use client"

import { getStudent360, keys } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../../shared/components/back-link"
import { LessonList } from "../../shared/components/lesson-list"
import { QueryState } from "../../shared/components/query-state"
import { fullName } from "../../shared/utils/names"
import { StudentAccountTab } from "./student-account-tab"
import { StudentAttendanceTab } from "./student-attendance-tab"
import { StudentGradesTab } from "./student-grades-tab"
import { StudentOverviewTab } from "./student-overview-tab"

const TABS = ["overview", "timetable", "grades", "attendance", "account"] as const

/**
 * Student 360 (ADM-3, UF-ADM-03): one place with Overview, Timetable, Grades, Attendance and Account.
 * `?id=` is the user id, `?tab=` the open tab. Opening the profile is audited by the backend (GEN-6).
 */
export function Student360Page() {
  const t = useT("students")
  const [id] = useQueryState("id", parseAsString)
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("overview"))
  const query = useQuery({
    queryKey: keys.admin.students.detail(id ?? ""),
    queryFn: ({ signal }) => getStudent360(id ?? "", { signal }),
    enabled: id !== null,
  })

  if (id === null) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("notSelected")} />
      </PageContainer>
    )
  }

  return (
    <QueryState query={query} rows={4}>
      {(data) => (
        <PageContainer
          title={fullName(data.profile)}
          description={`${data.profile.group.name}${data.profile.login ? ` · ${data.profile.login}` : ""}`}
          actions={<BackLink href="/students/" label={t("title")} />}
        >
          <Tabs
            value={TABS.includes(tab as (typeof TABS)[number]) ? tab : "overview"}
            onValueChange={(value) => void setTab(value === "overview" ? null : String(value))}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
              {TABS.map((name) => (
                <TabsTrigger key={name} value={name} className="min-h-11 md:min-h-7">
                  {t(`tabs.${name}`)}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">
              <StudentOverviewTab profile={data.profile} userId={id} />
            </TabsContent>
            <TabsContent value="timetable">
              <LessonList lessons={data.timetable_week} />
            </TabsContent>
            <TabsContent value="grades">
              <StudentGradesTab grades={data.grades} />
            </TabsContent>
            <TabsContent value="attendance">
              <StudentAttendanceTab attendance={data.attendance} />
            </TabsContent>
            <TabsContent value="account">
              <StudentAccountTab data={data} />
            </TabsContent>
          </Tabs>
        </PageContainer>
      )}
    </QueryState>
  )
}
