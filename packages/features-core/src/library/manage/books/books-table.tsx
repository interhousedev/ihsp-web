"use client"

import type { BookRow } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useIsMobile,
} from "@ihsp/ui"
import { IconArrowDown, IconArrowUp, IconArrowsSort } from "@tabler/icons-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { RightsBadge } from "../../catalog/rights-badge"
import { manageBookEditHref } from "../../utils/hrefs"

type SortKey = "title" | "rights" | "status" | "updated"
type Sort = { key: SortKey; direction: "asc" | "desc" }

const SORT_VALUE: Record<SortKey, (row: BookRow) => string> = {
  title: (row) => row.item.title.toLowerCase(),
  rights: (row) => row.rights,
  status: (row) => row.status,
  updated: (row) => row.updated_at,
}

/** A column header that sorts the rows loaded so far (the list has no server-side sort). */
function SortHead({ column, sort, onSort }: { column: SortKey; sort: Sort | null; onSort: (key: SortKey) => void }) {
  const t = useT("library.manage.books")
  const active = sort?.key === column
  const Icon = !active ? IconArrowsSort : sort.direction === "asc" ? IconArrowUp : IconArrowDown
  return (
    <TableHead scope="col" aria-sort={!active ? "none" : sort.direction === "asc" ? "ascending" : "descending"}>
      <button
        type="button"
        className="focus-visible:ring-ring -mx-1 flex min-h-11 items-center gap-1 rounded px-1 font-medium outline-none focus-visible:ring-2 md:min-h-8"
        onClick={() => onSort(column)}
      >
        {t(`column.${column}`)}
        <Icon className="size-4" aria-hidden />
      </button>
    </TableHead>
  )
}

function useBookCells() {
  const status = useT("library.item.status")
  const visibility = useT("library.manage.books.visibility")
  const textStatus = useT("library.manage.textStatus")
  return { status, visibility, textStatus }
}

function StatusBadge({ row }: { row: BookRow }) {
  const { status } = useBookCells()
  return <Badge variant={row.status === "published" ? "default" : "secondary"}>{status(row.status)}</Badge>
}

function RowLink({ row }: { row: BookRow }) {
  const t = useT("library.manage.books")
  if (!row.item.id) return <span>{row.item.title}</span>
  return (
    <Link href={manageBookEditHref(row.item.id)} className="font-medium break-words hover:underline">
      {row.item.title}
      <span className="sr-only">: {t("edit")}</span>
    </Link>
  )
}

/** The books table: a real table with headers from 768 px, a list of cards on phones. */
export function BooksTable({ rows }: { rows: readonly BookRow[] }) {
  const t = useT("library.manage.books")
  const cells = useBookCells()
  const format = useFormatters()
  const mobile = useIsMobile()
  const [sort, setSort] = useState<Sort | null>(null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    const value = SORT_VALUE[sort.key]
    const factor = sort.direction === "asc" ? 1 : -1
    return rows.toSorted((a, b) => value(a).localeCompare(value(b)) * factor)
  }, [rows, sort])
  const onSort = (key: SortKey) =>
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    )

  if (mobile) {
    return (
      <ul aria-label={t("tableLabel")} className="flex flex-col gap-2">
        {sorted.map((row) => (
          <li key={row.item.id ?? row.item.title} className="flex flex-col gap-2 rounded-xl border p-3">
            <RowLink row={row} />
            <p className="text-muted-foreground text-xs">{row.item.author_label}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge row={row} />
              <RightsBadge rights={row.rights} licence={row.item.book?.licence} />
              <Badge variant="outline">{cells.visibility(row.visibility)}</Badge>
              <Badge variant="outline">{cells.textStatus(row.text_status)}</Badge>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Table>
      <TableCaption className="sr-only">{t("tableLabel")}</TableCaption>
      <TableHeader>
        <TableRow>
          <SortHead column="title" sort={sort} onSort={onSort} />
          <SortHead column="rights" sort={sort} onSort={onSort} />
          <SortHead column="status" sort={sort} onSort={onSort} />
          <TableHead scope="col">{t("column.visibility")}</TableHead>
          <TableHead scope="col">{t("column.text")}</TableHead>
          <SortHead column="updated" sort={sort} onSort={onSort} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.item.id ?? row.item.title}>
            <TableCell className="max-w-72 whitespace-normal">
              <RowLink row={row} />
              <div className="text-muted-foreground text-xs">{row.item.author_label}</div>
            </TableCell>
            <TableCell>
              <RightsBadge rights={row.rights} licence={row.item.book?.licence} />
            </TableCell>
            <TableCell>
              <StatusBadge row={row} />
            </TableCell>
            <TableCell>{cells.visibility(row.visibility)}</TableCell>
            <TableCell>{cells.textStatus(row.text_status)}</TableCell>
            <TableCell className="text-muted-foreground">{format.date(row.updated_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
