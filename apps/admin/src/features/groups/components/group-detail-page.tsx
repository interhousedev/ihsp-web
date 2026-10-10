"use client"

import { getAdminGroupQuery, keys } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { GroupCurriculumTab } from "./group-curriculum-tab"
import { GroupPeopleCard } from "./group-people-card"
import { GroupStudentsCard } from "./group-students-card"

const TABS = ["overview", "curriculum"] as const

/**
 * One group (ADM-6, UF-ADM-04): curator, head student, archive state and the students with their subgroups; the
 * Curriculum tab (`?tab=curriculum`) has the curriculum stored from EMIS.
 */
export function GroupDetailPage() {
  const t = useT("groups")
  const [id] = useQueryState("id", parseAsString)
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("overview"))
  const query = useQuery({
    queryKey: keys.admin.groups.detail(id ?? ""),
    queryFn: getAdminGroupQuery(id ?? "").queryFn,
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
      {(group) => (
        <PageContainer
          title={group.name}
          description={[
            group.current_semester ? t("view.semester", { semester: group.current_semester }) : null,
            group.emis_group_id ? `EMIS ${group.emis_group_id}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          actions={<BackLink href="/groups/" label={t("title")} />}
        >
          <Tabs value={tab} onValueChange={(value) => void setTab(value === "curriculum" ? "curriculum" : null)}>
            <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
              <TabsTrigger value="overview" className="min-h-11 md:min-h-7">
                {t("view.tabs.overview")}
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="min-h-11 md:min-h-7">
                {t("view.tabs.curriculum")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="flex flex-col gap-4 pt-2">
              <GroupPeopleCard group={group} />
              <GroupStudentsCard group={group} />
            </TabsContent>
            <TabsContent value="curriculum">
              <GroupCurriculumTab groupId={group.id} />
            </TabsContent>
          </Tabs>
        </PageContainer>
      )}
    </QueryState>
  )
}
