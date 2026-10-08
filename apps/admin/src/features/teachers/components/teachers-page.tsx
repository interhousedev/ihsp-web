"use client"

import { getAdminTeachers, keys, type AdminUser } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, PageContainer, buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { ExportButton } from "../../shared/components/export-button"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { StatusBadge } from "../../shared/components/status-badge"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { SERVER_PAGE_SIZE, usePagedList } from "../../shared/hooks/use-paged-list"
import { col } from "../../shared/utils/columns"
import { downloadCsv } from "../../shared/utils/csv"
import { fetchAllPages } from "../../shared/utils/fetch-all-pages"
import { fullNameWithMiddle } from "../../shared/utils/names"
import { userStatusParam } from "../../shared/utils/status-param"
import { TOUCH } from "../../shared/utils/touch"

const FILTER_KEYS = ["query", "status"] as const

/** Teachers list (ADM-4): search, status filter and a link to create a new account. */
export function TeachersPage() {
  const t = useT("teachers")
  const f = useFormatters()
  const filters = useFilterState(FILTER_KEYS)
  const params = useMemo(
    () => ({ query: filters.values.query ?? undefined, status: userStatusParam(filters.values.status) }),
    [filters.values],
  )
  const source = usePagedList(keys.admin.teachers.list(params), (cursor, signal) =>
    getAdminTeachers({ ...params, cursor, limit: SERVER_PAGE_SIZE }, { signal }),
  )

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      { kind: "search", key: "query", label: t("filters.query"), placeholder: t("filters.queryPlaceholder") },
      {
        kind: "select",
        key: "status",
        label: t("filters.status"),
        allLabel: t("filters.allStatuses"),
        options: ["active", "pending_activation", "deactivated", "blocked"].map((value) => ({
          value,
          label: t(`status.${value}`),
        })),
      },
    ],
    [t],
  )

  const columns = useMemo(
    () => [
      col<AdminUser>("name", t("columns.name"), (teacher) => (
        <Link
          href={`/teachers/view/?id=${encodeURIComponent(teacher.id)}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {fullNameWithMiddle(teacher)}
        </Link>
      )),
      col<AdminUser>("login", t("columns.login"), (teacher) => teacher.login ?? "—"),
      col<AdminUser>("status", t("columns.status"), (teacher) => <StatusBadge status={teacher.status} />),
      col<AdminUser>("email", t("columns.email"), (teacher) => teacher.recovery_email ?? "—"),
      col<AdminUser>("last_login", t("columns.lastLogin"), (teacher) =>
        teacher.last_login_at ? f.dateTime(teacher.last_login_at) : "—",
      ),
    ],
    [f, t],
  )

  async function exportCsv() {
    const rows = await fetchAllPages((cursor) => getAdminTeachers({ ...params, cursor, limit: SERVER_PAGE_SIZE }))
    downloadCsv("teachers.csv", [
      [t("columns.name"), t("columns.login"), t("columns.status"), t("columns.email"), t("columns.lastLogin")],
      ...rows.map((teacher) => [
        fullNameWithMiddle(teacher),
        teacher.login,
        teacher.status,
        teacher.recovery_email,
        teacher.last_login_at,
      ]),
    ])
  }

  return (
    <PageContainer
      title={t("title")}
      description={t("description")}
      actions={
        <Link href="/teachers/new/" className={buttonVariants({ className: TOUCH })}>
          <Icons.add aria-hidden />
          {t("new")}
        </Link>
      }
    >
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(teacher) => teacher.id}
        emptyText={t("empty")}
        toolbar={
          <ListToolbar
            filters={toolbarFilters}
            values={filters.values}
            onChange={(key, value) => filters.set(key as (typeof FILTER_KEYS)[number], value)}
            onReset={filters.reset}
            active={filters.active}
          >
            <ExportButton onExport={exportCsv} />
          </ListToolbar>
        }
      />
    </PageContainer>
  )
}
