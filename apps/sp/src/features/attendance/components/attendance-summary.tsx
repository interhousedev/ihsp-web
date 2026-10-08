"use client"

import type { StudentAttendance } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useIsMobile } from "@ihsp/ui"

function percent(rate: number | null): string {
  return rate === null ? "–" : `${Math.round(rate * 100)}%`
}

/** Per subject: absences, excused, lessons with attendance taken, attendance rate (UF-WEB-12 step 2). */
export function AttendanceSummary({ summary }: { summary: StudentAttendance["summary"] }) {
  const t = useT("attendance.summary")
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <ul className="flex flex-col gap-2">
        {summary.map((row) => (
          <li key={row.subject.id}>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{row.subject.name}</span>
                  <span className="text-sm font-semibold tabular-nums">{percent(row.rate)}</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("absences")}: {row.absences} · {t("excused")}: {row.excused} · {t("lessons")}: {row.lessons}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("subject")}</TableHead>
          <TableHead className="text-center">{t("absences")}</TableHead>
          <TableHead className="text-center">{t("excused")}</TableHead>
          <TableHead className="text-center">{t("lessons")}</TableHead>
          <TableHead className="text-center">{t("rate")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summary.map((row) => (
          <TableRow key={row.subject.id}>
            <TableCell className="font-medium">{row.subject.name}</TableCell>
            <TableCell className="text-center tabular-nums">{row.absences}</TableCell>
            <TableCell className="text-center tabular-nums">{row.excused}</TableCell>
            <TableCell className="text-center tabular-nums">{row.lessons}</TableCell>
            <TableCell className="text-center tabular-nums">{percent(row.rate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
