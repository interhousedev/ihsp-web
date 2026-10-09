"use client"

import type { DataTableContent } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { useIsMobile } from "@ihsp/ui"
import { IconCopy, IconDownload } from "@tabler/icons-react"
import { useMemo, useState } from "react"
import { downloadText, fileNameFor } from "../lib/download"
import { SortControls } from "./data-table/sort-controls"
import { nextSort, sortRows, type SortState } from "./data-table/sort-rows"
import { TableCards } from "./data-table/table-cards"
import { tableToCsv, tableToTsv } from "./data-table/table-export"
import { TableGrid } from "./data-table/table-grid"
import { ToolbarButton } from "./toolbar-button"
import { useCopy } from "./use-copy"
import { ViewerEmpty } from "./viewer-empty"
import type { ViewerProps } from "./viewer-props"

/**
 * A data table (docs/reference/notebooklm.md § 3.4.5): a table from 768 px up and cards on a phone, sortable columns,
 * a Sources column of citation chips, Copy as TSV and Download CSV. Not editable.
 */
export function DataTableViewer({ artifact }: ViewerProps<"data_table">) {
  const content = artifact.content
  if (!content) return <ViewerEmpty />
  return <DataTableBody artifact={artifact} content={content} />
}

function DataTableBody({
  artifact,
  content,
}: Pick<ViewerProps<"data_table">, "artifact"> & { content: DataTableContent }) {
  const t = useT("notebooks")
  const locale = useLocale()
  const isMobile = useIsMobile()
  const copy = useCopy()
  const [sort, setSort] = useState<SortState>(null)
  const sorted = useMemo(() => sortRows(content.rows, content.columns, sort, locale), [content, sort, locale])
  const rows = sorted.map(({ row }) => row)
  const pageLabel = (page: number) => t("viewer.page", { page })

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div role="group" aria-label={t("viewers.table.toolbar")} className="flex flex-wrap gap-2">
        <ToolbarButton
          icon={IconCopy}
          label={t("table.copy")}
          disabled={rows.length === 0}
          onClick={() => void copy(tableToTsv(content, rows))}
        />
        <ToolbarButton
          icon={IconDownload}
          label={t("table.csv")}
          disabled={rows.length === 0}
          onClick={() =>
            downloadText(
              fileNameFor(content.title, "csv"),
              tableToCsv(content, rows, artifact.refs_index, t("table.sources"), pageLabel),
              "text/csv;charset=utf-8",
            )
          }
        />
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t("viewers.table.empty")}</p>
      ) : isMobile ? (
        <>
          <SortControls columns={content.columns} sort={sort} onChange={setSort} />
          <TableCards columns={content.columns} rows={sorted} refsIndex={artifact.refs_index} />
        </>
      ) : (
        <TableGrid
          title={content.title}
          columns={content.columns}
          rows={sorted}
          refsIndex={artifact.refs_index}
          sort={sort}
          onSort={(key) => setSort((current) => nextSort(current, key))}
        />
      )}
    </section>
  )
}
