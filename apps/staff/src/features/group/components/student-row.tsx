"use client"

import type { CuratorStudent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { fullName } from "../../shared/utils/people"
import { formatGpa, formatRate } from "../utils/students"

/** One student of the curator's list: subgroup, absence rate, GPA and the flags that need attention. */
export function StudentRow({ student, onOpen }: { student: CuratorStudent; onOpen: () => void }) {
  const t = useT("group.students")
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        data-flagged={student.flags.length > 0}
        className="hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full flex-col gap-1 rounded-lg border p-3 text-start outline-none focus-visible:ring-2 md:grid md:grid-cols-[minmax(0,2fr)_6rem_6rem_6rem_minmax(0,2fr)] md:items-center md:gap-3"
      >
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{fullName(student)}</span>
          {!student.registered ? <Badge variant="outline">{t("notRegistered")}</Badge> : null}
        </span>
        <span className="text-sm">
          <span className="text-muted-foreground md:sr-only">{t("subgroup")}: </span>
          {student.subgroup === null ? t("subgroupNotSet") : t("subgroupNumber", { number: student.subgroup })}
        </span>
        <span className="text-sm tabular-nums">
          <span className="text-muted-foreground md:sr-only">{t("absenceRate")}: </span>
          {formatRate(student.absence_rate)}
        </span>
        <span className="text-sm tabular-nums">
          <span className="text-muted-foreground md:sr-only">{t("gpa")}: </span>
          {formatGpa(student.gpa)}
        </span>
        <span className="flex flex-wrap gap-1">
          {student.flags.map((flag) => (
            <Badge key={flag} variant="destructive">
              {t(`flags.${flag}`)}
            </Badge>
          ))}
        </span>
      </button>
    </li>
  )
}
