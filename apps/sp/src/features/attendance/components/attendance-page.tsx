"use client"

import { addDays, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, DatePicker, PageContainer } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { useState, type ReactNode } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useAttendance } from "../hooks/use-attendance"
import { firstOfMonth } from "../utils/month-grid"
import { AbsenceCalendar } from "./absence-calendar"
import { AttendanceSummary } from "./attendance-summary"
import { MissedLessons } from "./missed-lessons"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/** Attendance (WEB-17, UF-WEB-12): a period, the summary per subject, the absence calendar and the missed lessons. */
export function AttendancePage() {
  const t = useT("attendance")
  const f = useFormatters()
  const [from, setFrom] = useQueryState("from", parseAsString)
  const [to, setTo] = useQueryState("to", parseAsString)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const query = useAttendance(from, to)
  const today = todayIso()

  function preset(start: string | null, end: string | null) {
    void setFrom(start)
    void setTo(end)
    setSelectedDay(null)
  }

  return (
    <PageContainer title={t("title")}>
      <section aria-label={t("period")} className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium sm:flex-none">
          {t("from")}
          <DatePicker
            value={query.data?.from ?? from}
            max={to ?? today}
            aria-label={t("from")}
            onChange={(next) => preset(next, to)}
          />
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium sm:flex-none">
          {t("to")}
          <DatePicker
            value={query.data?.to ?? to}
            min={from ?? undefined}
            max={today}
            aria-label={t("to")}
            onChange={(next) => preset(from, next)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => preset(null, null)}>
            {t("currentTerm")}
          </Button>
          <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => preset(firstOfMonth(today), today)}>
            {t("thisMonth")}
          </Button>
          <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => preset(addDays(today, -29), today)}>
            {t("last30")}
          </Button>
        </div>
      </section>
      <QueryState query={query} rows={4}>
        {(data) => {
          const missed = selectedDay ? data.missed.filter((item) => item.lesson.date === selectedDay) : data.missed
          return (
            <div className="flex flex-col gap-6">
              {data.not_taken > 0 ? (
                <Alert>
                  <AlertDescription data-testid="not-taken">
                    {t("notTaken", { count: data.not_taken })}
                  </AlertDescription>
                </Alert>
              ) : null}
              <Section title={t("summaryTitle")}>
                {data.summary.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("noSummary")}</p>
                ) : (
                  <AttendanceSummary summary={data.summary} />
                )}
              </Section>
              <Section title={t("calendarTitle")}>
                <AbsenceCalendar days={data.days} to={data.to} selected={selectedDay} onSelect={setSelectedDay} />
              </Section>
              <Section
                title={
                  selectedDay
                    ? t("missedOn", { date: f.date(selectedDay, { day: "numeric", month: "long" }) })
                    : t("missedTitle")
                }
              >
                <MissedLessons missed={missed} />
              </Section>
            </div>
          )
        }}
      </QueryState>
    </PageContainer>
  )
}
