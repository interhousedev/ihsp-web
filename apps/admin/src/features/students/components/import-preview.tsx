"use client"

import type { ImportPreview, ImportRow } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { fullNameWithMiddle } from "../../shared/utils/names"

function RowGroup({
  title,
  rows,
  tone,
  testId,
}: {
  title: string
  rows: ImportRow[]
  tone: "secondary" | "outline" | "destructive"
  testId: string
}) {
  const t = useT("students.import")
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant={tone}>{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noRows")}</p>
        ) : (
          <ul className="flex flex-col divide-y text-sm">
            {rows.map((row) => (
              <li key={row.line} className="flex flex-col gap-0.5 py-2">
                <span className="font-medium">{fullNameWithMiddle(row)}</span>
                <span className="text-muted-foreground text-xs">
                  {[
                    t("line", { line: row.line }),
                    row.group_name,
                    row.emis_student_id ? `EMIS ${row.emis_student_id}` : null,
                    row.note,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** The three groups of an import preview (UF-ADM-14): new students, changes and rows that conflict. */
export function ImportPreviewView({ preview }: { preview: ImportPreview }) {
  const t = useT("students.import")
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{t("unchanged", { count: preview.unchanged })}</p>
      <div className="grid gap-3 lg:grid-cols-3">
        <RowGroup title={t("new")} rows={preview.new} tone="secondary" testId="import-new" />
        <RowGroup title={t("changed")} rows={preview.changed} tone="outline" testId="import-changed" />
        <RowGroup title={t("conflicts")} rows={preview.conflicts} tone="destructive" testId="import-conflicts" />
      </div>
    </div>
  )
}
