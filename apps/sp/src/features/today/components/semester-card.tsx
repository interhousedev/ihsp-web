"use client"

import type { Alert, StudentToday } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, Stat } from "@ihsp/ui"
import { TodayCard } from "./today-card"

/**
 * This semester (WEB-3, UF-WEB-01, UF-WEB-02): GPA with its change, absences and when the marks were last synced.
 * Before the first sync finished it says that the marks are being imported.
 */
export function SemesterCard({ today, alerts }: { today: StudentToday; alerts: Alert[] }) {
  const t = useT("today.semester")
  const f = useFormatters()
  const { semester, synced_at } = today
  const importing = synced_at === null && semester.gpa === null
  const syncFailed = alerts.some((alert) => alert.kind === "sync_failed")
  const change = semester.gpa_change

  return (
    <TodayCard title={semester.semester ? t("titleNumber", { number: semester.semester }) : t("title")}>
      {importing ? (
        <p className="text-muted-foreground text-sm">{t("importing")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label={t("gpa")}
            value={semester.gpa === null ? "–" : semester.gpa.toFixed(2)}
            hint={
              change === null || change === 0 ? undefined : (
                <span className="inline-flex items-center gap-1">
                  {change > 0 ? (
                    <Icons.trendingUp className="size-3.5" aria-hidden />
                  ) : (
                    <Icons.trendingDown className="size-3.5" aria-hidden />
                  )}
                  {t("change", { change: `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(2)}` })}
                </span>
              )
            }
          />
          <Stat label={t("absences")} value={semester.absences} />
        </div>
      )}
      {synced_at ? (
        <p className={syncFailed ? "text-sm text-amber-600 dark:text-amber-400" : "text-muted-foreground text-xs"}>
          {syncFailed ? t("syncFailed", { time: f.time(synced_at) }) : t("updated", { when: f.relative(synced_at) })}
        </p>
      ) : null}
    </TodayCard>
  )
}
