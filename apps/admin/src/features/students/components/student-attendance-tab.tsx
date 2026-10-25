"use client"

import type { StudentAttendance } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import Link from "next/link"

/** Absences per subject and the missed lessons of a period (ADM-3 "Attendance"). */
export function StudentAttendanceTab({ attendance }: { attendance: StudentAttendance }) {
  const t = useT("students")
  const f = useFormatters()
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        {t("attendance.period", { from: f.date(attendance.from), to: f.date(attendance.to) })}
        {attendance.not_taken > 0 ? ` · ${t("attendance.notTaken", { count: attendance.not_taken })}` : ""}
      </p>
      {attendance.summary.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("attendance.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("attendance.subject")}</TableHead>
                <TableHead className="text-end">{t("attendance.lessons")}</TableHead>
                <TableHead className="text-end">{t("attendance.absences")}</TableHead>
                <TableHead className="text-end">{t("attendance.excused")}</TableHead>
                <TableHead className="text-end">{t("attendance.rate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.summary.map((row) => (
                <TableRow key={row.subject.id}>
                  <TableCell className="font-medium">{row.subject.name}</TableCell>
                  <TableCell className="text-end tabular-nums">{row.lessons}</TableCell>
                  <TableCell className="text-end tabular-nums">{row.absences}</TableCell>
                  <TableCell className="text-end tabular-nums">{row.excused}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {row.rate === null ? "—" : `${Math.round(row.rate * 100)}%`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("attendance.missed")}</h3>
        {attendance.missed.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("attendance.noMissed")}</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {attendance.missed.map((item) => (
              <li key={item.lesson.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <Link
                  href={`/lessons/view/?id=${encodeURIComponent(item.lesson.id)}`}
                  className="underline-offset-4 hover:underline"
                >
                  {f.date(item.lesson.date, { day: "numeric", month: "short" })} · {item.lesson.period}.{" "}
                  {item.lesson.subject.name}
                </Link>
                {item.excused ? <Badge variant="secondary">{t("attendance.excusedBadge")}</Badge> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
