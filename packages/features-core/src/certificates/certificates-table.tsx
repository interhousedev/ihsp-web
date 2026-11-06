"use client"

import type { CertificateType, StaffCertificateEntry } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { Checkbox, ResponsiveTable, type ResponsiveColumn } from "@ihsp/ui"
import { entrySummary, typeName } from "./utils"

type Props = {
  items: StaffCertificateEntry[]
  types: CertificateType[]
  selected: ReadonlySet<string>
  onSelectedChange: (next: Set<string>) => void
}

/** Entries with a checkbox per file; the chosen file ids go to the ZIP export. Cards on phones. */
export function CertificatesTable({ items, types, selected, onSelectedChange }: Props) {
  const t = useT("certificates.table")
  const locale = useLocale()
  const pageFileIds = items.flatMap((entry) => entry.files.map((file) => file.id))
  const allSelected = pageFileIds.length > 0 && pageFileIds.every((id) => selected.has(id))
  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(selected)
    for (const id of ids) {
      if (on) next.add(id)
      else next.delete(id)
    }
    onSelectedChange(next)
  }
  const selectAll = (
    <Checkbox
      aria-label={t("selectAll")}
      checked={allSelected}
      disabled={pageFileIds.length === 0}
      onCheckedChange={(checked) => toggle(pageFileIds, checked === true)}
    />
  )
  const typeOf = (entry: StaffCertificateEntry) => types.find((item) => item.id === entry.type_id)
  const columns: ResponsiveColumn<StaffCertificateEntry>[] = [
    {
      id: "select",
      header: selectAll,
      role: "action",
      headClassName: "w-10",
      cell: (entry) => {
        const ids = entry.files.map((file) => file.id)
        return (
          <label className="flex min-h-11 min-w-11 items-center justify-center md:min-h-0 md:min-w-0 md:justify-start">
            <Checkbox
              aria-label={t("select", { name: `${entry.student.name} ${typeName(typeOf(entry), locale)}` })}
              disabled={ids.length === 0}
              checked={ids.length > 0 && ids.every((id) => selected.has(id))}
              onCheckedChange={(checked) => toggle(ids, checked === true)}
            />
          </label>
        )
      },
    },
    {
      id: "student",
      header: t("student"),
      role: "title",
      cellClassName: "font-medium",
      cell: (entry) => entry.student.name,
    },
    {
      id: "group",
      header: t("group"),
      cell: (entry) => `${entry.student.group_name}${entry.student.subgroup ? ` / ${entry.student.subgroup}` : ""}`,
    },
    { id: "type", header: t("type"), cell: (entry) => typeName(typeOf(entry), locale) },
    { id: "result", header: t("result"), cell: (entry) => entrySummary(entry, typeOf(entry)) },
    {
      id: "files",
      header: t("files"),
      cell: (entry) => (entry.files.length > 0 ? t("fileCount", { count: entry.files.length }) : "—"),
    },
  ]
  return (
    <ResponsiveTable
      label={t("files")}
      rows={items}
      rowKey={(entry) => entry.id}
      columns={columns}
      cardsHeader={
        <label className="flex min-h-11 items-center gap-2 px-3 text-sm">
          {selectAll}
          <span aria-hidden>{t("selectAll")}</span>
        </label>
      }
    />
  )
}
