"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { buttonVariants, Skeleton } from "@ihsp/ui"
import { useMemo } from "react"
import { pageClass } from "../../../components/lib/page"
import { ScreenSummary } from "../../assistant/screen-context"
import { useFitRows } from "../../fit/use-fit-rows"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useToday } from "../api"
import { shortDate } from "../dates"
import { DeadlineStrip } from "./deadline-strip"
import { NextActionCard } from "./next-action-card"
import { Rhythm } from "./rhythm"
import { SeasonCard } from "./season-card"
import { UniSection } from "./uni-section"

/** The local calendar day as an ISO date (the server's list of deadlines is date-only). */
function localIso(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * "Сегодня": the home. The next action (≤3 ranked), the season checklist with streak and readiness, my universities
 * with fit rings, and the deadline strip. Data: `GET /today` and the fit rows of `GET /list/fit`.
 */
export function TodayPage() {
  const t = useT("today")
  const locale = useLocale()
  const today = useToday()
  const fit = useFitRows()
  const iso = useMemo(() => localIso(), [])
  const data = today.data
  return (
    <AdmissionShell home>
      <ScreenSummary
        title={t("title")}
        summary={data ? `Today. Season ${data.season.key}, ${data.next.length} next steps, readiness ${data.readiness.percent}%.` : "Today."}
      />
      <div className={pageClass("gap-3 md:gap-3.5 lg:pb-3")}>
        <header className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">
            {shortDate(iso, locale)}
            {data ? ` · ${t(`season.name.${data.season.key}`)}` : ""}
          </p>
        </header>
        {today.isPending ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" aria-busy>
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        ) : !data ? (
          <div className="bg-card rounded-card flex flex-wrap items-center gap-3 border p-4 text-sm">
            <span className="text-muted-foreground">{t("error")}</span>
            <button type="button" onClick={() => void today.refetch()} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("retry")}
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-3.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <NextActionCard actions={data.next} className="order-1 lg:col-start-1 lg:row-start-1" />
            <div className="bg-card rounded-card order-2 border px-3.5 py-2 lg:hidden">
              <Rhythm streak={data.streak} readiness={data.readiness.percent} />
            </div>
            <UniSection
              rows={fit.rows}
              deadlines={data.deadlines}
              today={iso}
              loading={fit.isPending}
              failed={Boolean(fit.error)}
              onRetry={fit.refetch}
              className="order-3 lg:order-0 lg:col-span-2 lg:row-start-2"
            />
            <DeadlineStrip items={data.deadlines} today={iso} className="order-4 lg:order-0 lg:col-span-2 lg:row-start-3" />
            <SeasonCard
              season={data.season.key}
              checks={data.season.checklist}
              streak={data.streak}
              readiness={data.readiness.percent}
              className="order-5 lg:order-0 lg:col-start-2 lg:row-start-1"
            />
          </div>
        )}
      </div>
    </AdmissionShell>
  )
}
