"use client"

import { getAdminGroupQuery, keys } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { GroupPeopleCard } from "./group-people-card"
import { GroupStudentsCard } from "./group-students-card"

/** One group (ADM-6, UF-ADM-04): curator, head student, archive state and the students with their subgroups. */
export function GroupDetailPage() {
  const t = useT("groups")
  const [id] = useQueryState("id", parseAsString)
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
          <GroupPeopleCard group={group} />
          <GroupStudentsCard group={group} />
        </PageContainer>
      )}
    </QueryState>
  )
}
