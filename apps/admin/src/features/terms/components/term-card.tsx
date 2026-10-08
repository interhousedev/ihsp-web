"use client"

import type { Term } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { TOUCH } from "../../shared/utils/touch"

/** One term: dates, the bell schedule as a list of periods, and counts of holidays and moved days. */
export function TermCard({ term, onEdit }: { term: Term; onEdit: () => void }) {
  const t = useT("terms")
  const f = useFormatters()
  const periods = [...term.bells].toSorted((a, b) => a.period - b.period || (a.weekdays[0] ?? 0) - (b.weekdays[0] ?? 0))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-2">
            {t("termTitle", { year: term.academic_year, half: term.half })}
            {term.is_current ? <Badge variant="secondary">{t("current")}</Badge> : null}
          </span>
          <Button type="button" variant="outline" className={TOUCH} onClick={onEdit}>
            {t("edit")}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p>{t("dates", { from: f.date(term.starts_on), to: f.date(term.ends_on) })}</p>
        <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {periods.map((bell, index) => (
            <li key={`${bell.period}-${index}`} className="text-muted-foreground">
              {t("bell", { period: bell.period, start: bell.start, end: bell.end })}
              {bell.weekdays.length < 6
                ? ` · ${bell.weekdays.map((weekday) => f.weekday(`2026-10-${String(4 + weekday).padStart(2, "0")}`, "short")).join(", ")}`
                : ""}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">
          {t("counts", { holidays: term.non_study_days.length, moved: term.moved_days.length })}
        </p>
      </CardContent>
    </Card>
  )
}
