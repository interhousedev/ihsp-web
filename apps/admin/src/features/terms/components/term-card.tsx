"use client"

import type { Term } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { useControlLabel } from "../../shared/hooks/use-control-label"
import { CONTROL_NAMES } from "../../shared/utils/controls"
import { formatPeriod } from "../../shared/utils/period"
import { TOUCH } from "../../shared/utils/touch"
import { EmisBadge } from "./emis-badge"

/**
 * One term: dates, the control weeks, the bell schedule as a list of periods (an EMIS badge marks the ones synced from
 * EMIS), and counts of holidays and moved days.
 */
export function TermCard({ term, onEdit }: { term: Term; onEdit: () => void }) {
  const t = useT("terms")
  const tControls = useT("terms.controls")
  const controlLabel = useControlLabel()
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
        <ul aria-label={tControls("title")} className="flex flex-wrap gap-2">
          {CONTROL_NAMES.map((name) => {
            const period = term.control_periods[name]
            return (
              <li key={name}>
                <Badge variant={period ? "secondary" : "outline"} className="h-auto py-0.5 whitespace-normal">
                  {tControls("chip", {
                    name: controlLabel(name),
                    period: period ? formatPeriod(f.date, period) : tControls("notSet"),
                  })}
                </Badge>
              </li>
            )
          })}
        </ul>
        <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {periods.map((bell, index) => (
            <li key={`${bell.period}-${index}`} className="text-muted-foreground flex flex-wrap items-center gap-x-1.5">
              <span>
                {t("bell", { period: bell.period, start: bell.start, end: bell.end })}
                {bell.weekdays.length < 6
                  ? ` · ${bell.weekdays.map((weekday) => f.weekday(`2026-10-${String(4 + weekday).padStart(2, "0")}`, "short")).join(", ")}`
                  : ""}
              </span>
              {bell.source === "emis" ? <EmisBadge /> : null}
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
