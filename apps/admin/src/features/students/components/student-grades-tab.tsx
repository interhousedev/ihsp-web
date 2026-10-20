"use client"

import type { SemesterGrades } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { TemporaryGpa } from "@ihsp/features-core"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"

function mark(value: number | null): string {
  return value === null ? "—" : value.toFixed(1)
}

/** Semester grades, read-only (ADM-3). */
export function StudentGradesTab({ grades }: { grades: SemesterGrades }) {
  const t = useT("students")
  const f = useFormatters()
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {t("grades.semester", { semester: grades.semester })} ·{" "}
        {t("grades.gpa", { gpa: grades.gpa === null ? "—" : grades.gpa.toFixed(2) })}
        {grades.synced_at ? ` · ${t("grades.synced", { date: f.dateTime(grades.synced_at) })}` : ""}
      </p>
      {grades.rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("grades.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("grades.subject")}</TableHead>
                <TableHead className="text-end">{t("grades.lesson")}</TableHead>
                <TableHead className="text-end">{t("grades.midterm")}</TableHead>
                <TableHead className="text-end">{t("grades.final")}</TableHead>
                <TableHead className="text-end">{t("grades.semesterMark")}</TableHead>
                <TableHead className="text-end">{t("grades.emisRating")}</TableHead>
                <TableHead className="text-end">{t("grades.count")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.rows.map((row) => (
                <TableRow key={row.subject.id}>
                  <TableCell className="font-medium">{row.subject.name}</TableCell>
                  <TableCell className="text-end tabular-nums">{mark(row.lesson_avg)}</TableCell>
                  <TableCell className="text-end tabular-nums">{mark(row.midterm_avg)}</TableCell>
                  <TableCell className="text-end tabular-nums">{mark(row.final_avg)}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {row.semester_mark ?? "—"}
                    <TemporaryGpa value={row.gpa_with_temporary} />
                  </TableCell>
                  <TableCell className="text-end tabular-nums">{row.emis_rating ?? "—"}</TableCell>
                  <TableCell className="text-end tabular-nums">{row.marks_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
