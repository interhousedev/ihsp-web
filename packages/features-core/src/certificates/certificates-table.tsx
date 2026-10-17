"use client"

import type { CertificateType, StaffCertificateEntry } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import { entrySummary, typeName } from "./utils"

type Props = {
  items: StaffCertificateEntry[]
  types: CertificateType[]
  selected: ReadonlySet<string>
  onSelectedChange: (next: Set<string>) => void
}

/** Entries with a checkbox per file; the chosen file ids go to the ZIP export. */
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
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label={t("selectAll")}
                checked={allSelected}
                disabled={pageFileIds.length === 0}
                onCheckedChange={(checked) => toggle(pageFileIds, checked === true)}
              />
            </TableHead>
            <TableHead>{t("student")}</TableHead>
            <TableHead>{t("group")}</TableHead>
            <TableHead>{t("type")}</TableHead>
            <TableHead>{t("result")}</TableHead>
            <TableHead>{t("files")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((entry) => {
            const ids = entry.files.map((file) => file.id)
            const type = types.find((item) => item.id === entry.type_id)
            return (
              <TableRow key={entry.id}>
                <TableCell>
                  <Checkbox
                    aria-label={t("select", { name: `${entry.student.name} ${typeName(type, locale)}` })}
                    disabled={ids.length === 0}
                    checked={ids.length > 0 && ids.every((id) => selected.has(id))}
                    onCheckedChange={(checked) => toggle(ids, checked === true)}
                  />
                </TableCell>
                <TableCell className="font-medium">{entry.student.name}</TableCell>
                <TableCell>
                  {entry.student.group_name}
                  {entry.student.subgroup ? ` / ${entry.student.subgroup}` : ""}
                </TableCell>
                <TableCell>{typeName(type, locale)}</TableCell>
                <TableCell>{entrySummary(entry)}</TableCell>
                <TableCell>{entry.files.length > 0 ? t("fileCount", { count: entry.files.length }) : "—"}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
