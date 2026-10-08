"use client"

import { getAdminGroupsQuery, getGroupsStats, keys, type GroupItem, type GroupStat } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { StatusBadge } from "../../shared/components/status-badge"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { useArrayList } from "../../shared/hooks/use-paged-list"
import { col } from "../../shared/utils/columns"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { CreateGroupDialog } from "./create-group-dialog"

const FILTER_KEYS = ["status"] as const

type Row = GroupItem & { stat: GroupStat | undefined }

function percent(value: number | null | undefined): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`
}

/** Groups with students count, subgroups assigned, attendance rate and average GPA (ADM-6; stats are merged in). */
export function GroupsPage() {
  const t = useT("groups")
  const filters = useFilterState(FILTER_KEYS)
  const [createOpen, setCreateOpen] = useState(false)
  const status =
    filters.values.status === "active" || filters.values.status === "archived" ? filters.values.status : undefined

  const groups = useQuery(getAdminGroupsQuery({ status }))
  const stats = useQuery({ queryKey: keys.admin.groups.stats(), queryFn: ({ signal }) => getGroupsStats({ signal }) })
  const source = useArrayList<Row>({
    data: groups.data?.map((group) => ({ ...group, stat: stats.data?.find((item) => item.group_id === group.id) })),
    isPending: groups.isPending,
    isError: groups.isError,
    error: groups.error,
    refetch: () => {
      void groups.refetch()
      void stats.refetch()
    },
  })

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      {
        kind: "select",
        key: "status",
        label: t("filters.status"),
        allLabel: t("filters.allStatuses"),
        options: [
          { value: "active", label: t("status.active") },
          { value: "archived", label: t("status.archived") },
        ],
      },
    ],
    [t],
  )

  const columns = useMemo(
    () => [
      col<Row>("name", t("columns.name"), (group) => (
        <Link
          href={`/groups/view/?id=${encodeURIComponent(group.id)}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {group.name}
        </Link>
      )),
      col<Row>("semester", t("columns.semester"), (group) => group.current_semester ?? "—"),
      col<Row>("students", t("columns.students"), (group) => group.students_count),
      col<Row>("subgroups", t("columns.subgroups"), (group) => `${group.subgroups_assigned}/${group.students_count}`),
      col<Row>("unregistered", t("columns.unregistered"), (group) => group.unregistered_count),
      col<Row>("attendance", t("columns.attendance"), (group) => percent(group.stat?.attendance_rate)),
      col<Row>("gpa", t("columns.gpa"), (group) =>
        group.stat?.average_gpa == null ? "—" : group.stat.average_gpa.toFixed(2),
      ),
      col<Row>("curator", t("columns.curator"), (group) => (group.curator ? fullName(group.curator) : "—")),
      col<Row>("status", t("columns.status"), (group) => <StatusBadge status={group.status} />),
    ],
    [t],
  )

  return (
    <PageContainer
      title={t("title")}
      description={t("description")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setCreateOpen(true)}>
          <Icons.add aria-hidden />
          {t("new")}
        </Button>
      }
    >
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(group) => group.id}
        emptyText={t("empty")}
        toolbar={
          <ListToolbar
            filters={toolbarFilters}
            values={filters.values}
            onChange={(key, value) => filters.set(key as (typeof FILTER_KEYS)[number], value)}
            onReset={filters.reset}
            active={filters.active}
          />
        }
      />
      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  )
}
