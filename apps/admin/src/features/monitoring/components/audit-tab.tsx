"use client"

import { getAdminAudit, keys, type AdminAuditParams, type AuditItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { useMemo } from "react"
import { ExportButton } from "../../shared/components/export-button"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { SERVER_PAGE_SIZE, usePagedList } from "../../shared/hooks/use-paged-list"
import { col } from "../../shared/utils/columns"
import { downloadCsv } from "../../shared/utils/csv"
import { fetchAllPages } from "../../shared/utils/fetch-all-pages"
import { fullName } from "../../shared/utils/names"

const FILTER_KEYS = ["user_id", "type", "from", "to"] as const

function details(item: AuditItem): string {
  const text = JSON.stringify(item.metadata)
  return text === "{}" ? "" : text
}

/** Audit log with filters by user, event type and date (ADM-14, UF-ADM-13), exportable as CSV (ADM-16). */
export function AuditTab() {
  const t = useT("monitoring.audit")
  const f = useFormatters()
  const filters = useFilterState(FILTER_KEYS)
  const params = useMemo<AdminAuditParams>(
    () => ({
      user_id: filters.values.user_id ?? undefined,
      type: filters.values.type ?? undefined,
      from: filters.values.from ?? undefined,
      to: filters.values.to ?? undefined,
    }),
    [filters.values],
  )
  const source = usePagedList(keys.admin.audit(params), (cursor, signal) =>
    getAdminAudit({ ...params, cursor, limit: SERVER_PAGE_SIZE }, { signal }),
  )

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      { kind: "search", key: "user_id", label: t("filters.user"), placeholder: t("filters.userPlaceholder") },
      { kind: "search", key: "type", label: t("filters.type"), placeholder: t("filters.typePlaceholder") },
      { kind: "date", key: "from", label: t("filters.from") },
      { kind: "date", key: "to", label: t("filters.to") },
    ],
    [t],
  )

  const columns = useMemo(
    () => [
      col<AuditItem>("time", t("columns.time"), (item) => (
        <span className="font-medium">{f.dateTime(item.created_at)}</span>
      )),
      col<AuditItem>("type", t("columns.type"), (item) => (
        <span className="font-mono text-xs break-all">{item.type}</span>
      )),
      col<AuditItem>("actor", t("columns.actor"), (item) => (item.actor ? fullName(item.actor) : "—")),
      col<AuditItem>("ip", t("columns.ip"), (item) => item.ip ?? "—"),
      col<AuditItem>("details", t("columns.details"), (item) => (
        <span className="text-muted-foreground line-clamp-2 text-xs break-all">{details(item) || "—"}</span>
      )),
    ],
    [f, t],
  )

  async function exportCsv() {
    const rows = await fetchAllPages((cursor) => getAdminAudit({ ...params, cursor, limit: SERVER_PAGE_SIZE }))
    downloadCsv("audit.csv", [
      [t("columns.time"), t("columns.type"), t("columns.actor"), t("columns.ip"), t("columns.details")],
      ...rows.map((item) => [
        item.created_at,
        item.type,
        item.actor ? fullName(item.actor) : "",
        item.ip,
        details(item),
      ]),
    ])
  }

  return (
    <PagedTable
      source={source}
      columns={columns}
      getRowId={(item) => item.id}
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
  )
}
