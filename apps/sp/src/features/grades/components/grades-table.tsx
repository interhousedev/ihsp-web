"use client"

import type { SemesterGrades } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { MarkBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import Link from "next/link"
import { subjectMarksHref } from "../utils/links"

/** The semester as a table: subject, lesson / midterm / final averages, semester mark, EMIS rating (WEB-12). */
export function GradesTable({ grades }: { grades: SemesterGrades }) {
  const t = useT("grades.semester")
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("subject")}</TableHead>
          <TableHead className="text-center">{t("lessonAvg")}</TableHead>
          <TableHead className="text-center">{t("midtermAvg")}</TableHead>
          <TableHead className="text-center">{t("finalAvg")}</TableHead>
          <TableHead className="text-center">{t("semesterMark")}</TableHead>
          <TableHead className="text-center">{t("emisRating")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grades.rows.map((row) => (
          <TableRow key={row.subject.id}>
            <TableCell className="font-medium">
              <Link href={subjectMarksHref(row.subject.id, grades.semester)} className="hover:underline">
                {row.subject.name}
              </Link>
              <span className="text-muted-foreground block text-xs">{t("marksCount", { count: row.marks_count })}</span>
            </TableCell>
            <TableCell className="text-center">
              <MarkBadge mark={row.lesson_avg} />
            </TableCell>
            <TableCell className="text-center">
              <MarkBadge mark={row.midterm_avg} />
            </TableCell>
            <TableCell className="text-center">
              <MarkBadge mark={row.final_avg} />
            </TableCell>
            <TableCell className="text-center">
              <MarkBadge mark={row.semester_mark} size="lg" />
            </TableCell>
            <TableCell className="text-center">{row.emis_rating ?? "–"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
