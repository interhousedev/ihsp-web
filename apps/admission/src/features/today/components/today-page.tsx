"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { pageClass } from "../../../components/lib/page"
import { ScreenSummary } from "../../assistant/screen-context"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { daysBetween, shortDate } from "../dates"
import { TODAY_DATA, TODAY_STATES, type TodayStateId } from "../today-mock"
import { DeadlineStrip } from "./deadline-strip"
import { MockBottomBar } from "./mock-bottom-bar"
import { NextActionCard } from "./next-action-card"
import { Rhythm } from "./rhythm"
import { SeasonCard } from "./season-card"
import { StateSwitcher } from "./state-switcher"
import { UniSection } from "./uni-section"

/**
 * "Сегодня": the new home. One viewport at 1280×800: the next action (≤3 ranked), the season checklist with streak
 * and readiness, my universities with fit rings, and the deadline strip. MOCK: data comes from `today-mock.ts`.
 */
export function TodayPage() {
  const t = useT("today")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const param = useSearchParams().get("state")
  const id: TodayStateId = TODAY_STATES.find((state) => state === param) ?? "g11-november"
  const data = TODAY_DATA[id]
  const reply = data.season === "results" ? daysBetween(data.today, "2027-05-01") : null
  return (
    <AdmissionShell home>
      <ScreenSummary title={t("title")} summary={`Today (mock). State ${id}, season ${data.season}.`} />
      <div className={pageClass("gap-3 md:gap-3.5 lg:pb-3")}>
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {t("title")}
              <span className="text-muted-foreground rounded-full border border-dashed px-2 py-0.5 text-[11px] leading-4 font-normal tracking-normal">
                {t("mock")}
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {shortDate(data.today, locale)} · {t(`season.name.${data.season}`)}
              {reply !== null ? ` · ${t("replyDeadline", { n: reply })}` : ""}
            </p>
          </div>
          <StateSwitcher value={id} onChange={(next) => router.replace(`${pathname}?state=${next}`, { scroll: false })} />
        </header>
        <div className="grid gap-3 md:gap-3.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <NextActionCard actions={data.actions} className="order-1 lg:col-start-1 lg:row-start-1" />
          <div className="bg-card rounded-card order-2 border px-3.5 py-2 lg:hidden">
            <Rhythm streak={data.streak} readiness={data.readiness} />
          </div>
          <UniSection unis={data.unis} professions={data.professions} today={data.today} className="order-3 lg:order-0 lg:col-span-2 lg:row-start-2" />
          <DeadlineStrip items={data.deadlines} today={data.today} later={data.grade === 10} className="order-4 lg:order-0 lg:col-span-2 lg:row-start-3" />
          <SeasonCard
            season={data.season}
            checks={data.checks}
            streak={data.streak}
            readiness={data.readiness}
            className="order-5 lg:order-0 lg:col-start-2 lg:row-start-1"
          />
        </div>
      </div>
      <MockBottomBar />
    </AdmissionShell>
  )
}
