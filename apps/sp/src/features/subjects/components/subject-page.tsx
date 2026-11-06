"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { SubjectMarksTab } from "./subject-marks-tab"
import { SubjectNotebookButton } from "./subject-notebook-button"
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { BackLink, QueryState } from "@ihsp/features-core"
import { useSubject } from "../hooks/use-subjects"
import { SubjectHub } from "./subject-hub"
import { SubjectMaterialsTab } from "./subject-materials-tab"
import { SubjectOverviewTab } from "./subject-overview-tab"

const TABS = ["overview", "marks", "lessons", "materials"] as const

/** One subject (WEB-8, WEB-13, UF-WEB-05): `?id=&semester=&tab=`; Overview first, then My marks with the planner, Lessons with their marks and attendance, then Materials. The notebook is in the header. */
export function SubjectPage() {
  const t = useT("subjects")
  const [id] = useQueryState("id", parseAsString)
  const [semester] = useQueryState("semester", parseAsInteger)
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("overview"))
  const query = useSubject(id, semester ?? undefined)

  if (!id) return <StateView state="empty" emptyText={t("notFound")} />

  return (
    <PageContainer
      title={query.data?.subject.name ?? t("title")}
      meta={query.data ? t("semesterLabel", { number: query.data.semester }) : undefined}
      actions={query.data ? <SubjectNotebookButton subjectId={query.data.subject.id} /> : undefined}
    >
      <BackLink href="/subjects/" label={t("title")} />
      <QueryState query={query} rows={4}>
        {(detail) => (
          <Tabs value={tab} onValueChange={(value) => void setTab(TABS.find((item) => item === value) ?? "overview")}>
            <TabsList className="h-auto min-h-11 w-full md:w-fit">
              {TABS.map((value) => (
                <TabsTrigger key={value} value={value} className="min-h-11 px-3">
                  {t(`tabs.${value}`)}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview" className="pt-2">
              <SubjectOverviewTab detail={detail} />
            </TabsContent>
            <TabsContent value="marks" className="pt-2">
              <SubjectMarksTab detail={detail} />
            </TabsContent>
            <TabsContent value="lessons" className="pt-2">
              <SubjectHub subjectId={detail.subject.id} semester={detail.semester} />
            </TabsContent>
            <TabsContent value="materials" className="pt-2">
              <SubjectMaterialsTab detail={detail} />
            </TabsContent>
          </Tabs>
        )}
      </QueryState>
    </PageContainer>
  )
}
