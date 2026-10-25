"use client"

import type { AttendanceReport } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useIsMobile } from "@ihsp/ui"
import { formatRate } from "../utils/students"

type Row = AttendanceReport["rows"][number]

/**
 * The rows of a group attendance report (STF-13, UF-STF-11): absences, excused absences, lessons, absence rate and
 * lessons without attendance, which are counted separately and never as "present". A table from 768 px, cards on
 * phones. In the "per lesson" view a row with absences has an Excuse button.
 */
export function AttendanceReportView({
  report,
  onExcuse,
}: {
  report: AttendanceReport
  /** Opens the excuse dialog for a lesson row. */
  onExcuse?: (row: Row) => void
}) {
  const t = useT("group.attendance")
  const isMobile = useIsMobile()
  const canExcuse = onExcuse !== undefined && report.view === "lesson"

  if (isMobile) {
    return (
      <ul className="flex flex-col gap-2">
        {report.rows.map((row) => (
          <li key={row.key} className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-sm font-medium">{row.label}</span>
            <span className="text-muted-foreground text-xs">
              {t("absencesLine", { absences: row.absences, excused: row.excused })} ·{" "}
              {t("rateLine", { rate: formatRate(row.rate) })}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("lessonsLine", { lessons: row.lessons })}
              {row.not_taken > 0 ? ` · ${t("notTakenLine", { count: row.not_taken })}` : ""}
            </span>
            {canExcuse && row.absences > 0 ? (
              <Button variant="outline" className="mt-1 min-h-11 w-fit" onClick={() => onExcuse(row)}>
                {t("excuse")}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.label")}</TableHead>
            <TableHead className="text-end">{t("columns.absences")}</TableHead>
            <TableHead className="text-end">{t("columns.excused")}</TableHead>
            <TableHead className="text-end">{t("columns.lessons")}</TableHead>
            <TableHead className="text-end">{t("columns.rate")}</TableHead>
            <TableHead className="text-end">{t("columns.notTaken")}</TableHead>
            {canExcuse ? (
              <TableHead>
                <span className="sr-only">{t("columns.actions")}</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-end tabular-nums">{row.absences}</TableCell>
              <TableCell className="text-end tabular-nums">{row.excused}</TableCell>
              <TableCell className="text-end tabular-nums">{row.lessons}</TableCell>
              <TableCell className="text-end tabular-nums">{formatRate(row.rate)}</TableCell>
              <TableCell className="text-end tabular-nums">{row.not_taken}</TableCell>
              {canExcuse ? (
                <TableCell className="text-end">
                  {row.absences > 0 ? (
                    <Button variant="outline" onClick={() => onExcuse(row)}>
                      {t("excuse")}
                    </Button>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
