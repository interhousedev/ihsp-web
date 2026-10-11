"use client"

import { getAdminStudents, keys, type StudentItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Icons, PageContainer, buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { ExportButton } from "../../shared/components/export-button"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { StatusBadge } from "../../shared/components/status-badge"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { SERVER_PAGE_SIZE, usePagedList } from "../../shared/hooks/use-paged-list"
import { useGroupOptions } from "../../shared/hooks/use-lookups"
import { col, selectCol } from "../../shared/utils/columns"
import { downloadCsv } from "../../shared/utils/csv"
import { fetchAllPages } from "../../shared/utils/fetch-all-pages"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { STUDENT_FILTER_KEYS, studentParams } from "../utils/student-params"

/** Students list (ADM-3, UF-ADM-03): search and filters in the URL, rows open the Student 360 page, CSV export. */
export function StudentsPage() {
  const t = useT("students")
  const tSel = useT("shared.selection")
  const f = useFormatters()
  const filters = useFilterState(STUDENT_FILTER_KEYS)
  const groups = useGroupOptions()
  const params = useMemo(() => studentParams(filters.values), [filters.values])

  const source = usePagedList(keys.admin.students.list(params), (cursor, signal) =>
    getAdminStudents({ ...params, cursor, limit: SERVER_PAGE_SIZE }, { signal }),
  )

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      { kind: "search", key: "query", label: t("filters.query"), placeholder: t("filters.queryPlaceholder") },
      {
        kind: "select",
        key: "group_id",
        label: t("filters.group"),
        allLabel: t("filters.allGroups"),
        options: (groups.data ?? []).map((group) => ({ value: group.id, label: group.name })),
      },
      {
        kind: "select",
        key: "subgroup",
        label: t("filters.subgroup"),
        allLabel: t("filters.allSubgroups"),
        options: [
          { value: "1", label: t("subgroup", { number: 1 }) },
          { value: "2", label: t("subgroup", { number: 2 }) },
        ],
      },
      {
        kind: "select",
        key: "status",
        label: t("filters.status"),
        allLabel: t("filters.allStatuses"),
        options: [
          { value: "active", label: t("status.active") },
          { value: "left", label: t("status.left") },
        ],
      },
      {
        kind: "select",
        key: "emis_status",
        label: t("filters.emisStatus"),
        allLabel: t("filters.allEmis"),
        options: [
          { value: "active", label: t("emis.active") },
          { value: "needs_reauth", label: t("emis.needs_reauth") },
        ],
      },
      {
        kind: "select",
        key: "registered",
        label: t("filters.registered"),
        allLabel: t("filters.allRegistered"),
        options: [
          { value: "true", label: t("registered.yes") },
          { value: "false", label: t("registered.no") },
        ],
      },
    ],
    [groups.data, t],
  )

  const columns = useMemo(
    () => [
      selectCol<StudentItem>({
        all: tSel("selectAll"),
        row: (student) => tSel("selectRow", { name: fullName(student) }),
      }),
      col<StudentItem>(
        "name",
        t("columns.name"),
        (student) => (
          <Link
            href={`/students/view/?id=${encodeURIComponent(student.user_id)}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {fullName(student)}
          </Link>
        ),
        { sort: fullName },
      ),
      col<StudentItem>("login", t("columns.login"), (student) => student.login ?? "—", {
        sort: (student) => student.login,
      }),
      col<StudentItem>("group", t("columns.group"), (student) => student.group?.name ?? "—", {
        sort: (student) => student.group?.name,
      }),
      col<StudentItem>("subgroup", t("columns.subgroup"), (student) => student.subgroup ?? "—", {
        sort: (student) => student.subgroup,
      }),
      col<StudentItem>("status", t("columns.status"), (student) => <StatusBadge status={student.status} />, {
        sort: (student) => student.status,
      }),
      col<StudentItem>("emis", t("columns.emis"), (student) => <StatusBadge status={student.emis_status} />, {
        sort: (student) => student.emis_status,
      }),
      col<StudentItem>(
        "registered",
        t("columns.registered"),
        (student) => (
          <Badge variant={student.registered ? "secondary" : "outline"}>
            {student.registered ? t("registered.yes") : t("registered.no")}
          </Badge>
        ),
        { sort: (student) => student.registered },
      ),
      col<StudentItem>(
        "synced",
        t("columns.synced"),
        (student) => (student.synced_at ? f.dateTime(student.synced_at) : "—"),
        { sort: (student) => student.synced_at },
      ),
    ],
    [f, t, tSel],
  )

  function studentsCsv(rows: StudentItem[]) {
    downloadCsv("students.csv", [
      [
        t("columns.name"),
        t("columns.login"),
        t("columns.group"),
        t("columns.subgroup"),
        t("columns.status"),
        t("columns.emis"),
        t("columns.registered"),
      ],
      ...rows.map((student) => [
        fullName(student),
        student.login,
        student.group?.name,
        student.subgroup,
        student.status,
        student.emis_status,
        student.registered ? t("registered.yes") : t("registered.no"),
      ]),
    ])
  }

  async function exportCsv() {
    studentsCsv(await fetchAllPages((cursor) => getAdminStudents({ ...params, cursor, limit: SERVER_PAGE_SIZE })))
  }

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Link href="/students/import/" className={buttonVariants({ variant: "outline", className: TOUCH })}>
          <Icons.upload aria-hidden />
          {t("importAction")}
        </Link>
      }
    >
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(student) => student.user_id}
        emptyText={t("empty")}
        renderSelectionActions={(selected) => (
          <ExportButton label={tSel("exportSelected")} onExport={async () => studentsCsv(selected)} />
        )}
        toolbar={
          <ListToolbar
            filters={toolbarFilters}
            values={filters.values}
            onChange={(key, value) => filters.set(key as (typeof STUDENT_FILTER_KEYS)[number], value)}
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
