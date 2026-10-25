"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { WidgetFrame } from "../widget-frame"
import { BigNumber } from "./shared"

/** The semester: GPA out of 5 (as the API gives it) with a progress bar, absences, and when the marks were synced. */
export function SemesterSummaryWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.semester")
  const d = useT("today.dashboard")
  const f = useFormatters()
  const today = useToday().data
  const semester = today?.semester
  const gpa = semester?.gpa ?? null
  const importing = today ? today.synced_at === null && gpa === null : false
  const change = semester?.gpa_change ?? null
  const compact = widget.size === "1x1"
  const detailed = widget.size === "2x2"
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={semester?.semester ? t("titleNumber", { number: semester.semester }) : t("title")}
      href="/grades/"
    >
      {importing ? (
        <span className="text-xs">{t("importing")}</span>
      ) : (
        <>
          <div className="flex items-end gap-4">
            <BigNumber value={gpa === null ? "–" : gpa.toFixed(2)} label={d("gpa")} />
            {!compact ? <BigNumber value={semester?.absences ?? "–"} label={t("absences")} /> : null}
          </div>
          {gpa !== null ? (
            <div
              role="progressbar"
              aria-label={d("gpa")}
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={gpa}
              className="h-1.5 w-full overflow-hidden rounded-full bg-current/20"
            >
              <div className="h-full rounded-full bg-current" style={{ width: `${Math.min(100, (gpa / 5) * 100)}%` }} />
            </div>
          ) : null}
          {detailed && change !== null && change !== 0 ? (
            <span className="text-xs opacity-80">
              {t("change", {
                change: `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(2)}`,
              })}
            </span>
          ) : null}
          {detailed && today?.synced_at ? (
            <span className="text-xs opacity-80">{t("updated", { when: f.relative(today.synced_at) })}</span>
          ) : null}
        </>
      )}
    </WidgetFrame>
  )
}
