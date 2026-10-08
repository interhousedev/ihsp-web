"use client"

import { getMeProfileQuery, getMeTimetableQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, PageContainer, useIsMobile } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { CalendarFeedDialog } from "../../calendar-feed/components/calendar-feed-dialog"
import { QueryState } from "../../shared/components/query-state"
import { useNow } from "../../shared/hooks/use-now"
import { mondayOf, selectedDay, subgroupsOf, weekRange } from "../utils/week"
import { TimetableDayList } from "./timetable-day-list"
import { TimetableWeekGrid } from "./timetable-week-grid"
import { WeekSwitcher } from "./week-switcher"

/**
 * Timetable (WEB-5, WEB-6, UF-WEB-03): the week as a grid on desktop, a day list on phones, week switcher and the
 * calendar feed. `?week=` (a Monday) and `?day=` keep the view in the address.
 */
export function TimetablePage() {
  const t = useT("timetable")
  const isMobile = useIsMobile()
  const now = useNow()
  const [weekParam, setWeek] = useQueryState("week", parseAsString)
  const [dayParam, setDay] = useQueryState("day", parseAsString)
  const monday = mondayOf(weekParam)
  const day = selectedDay(monday, dayParam)
  const query = useQuery(getMeTimetableQuery(weekRange(monday)))
  const profile = useQuery(getMeProfileQuery())
  const subgroupUnset = profile.data?.subgroup === null

  return (
    <PageContainer title={t("title")} description={t("description")} actions={<CalendarFeedDialog />}>
      <WeekSwitcher
        monday={monday}
        onChange={(next) => {
          void setWeek(next)
          void setDay(null)
        }}
      />
      <QueryState query={query} rows={4}>
        {(lessons) => {
          const hint = subgroupUnset && lessons.some((lesson) => subgroupsOf(lesson).length > 0)
          return (
            <>
              {hint ? (
                <Alert>
                  <AlertDescription>{t("subgroupHint")}</AlertDescription>
                </Alert>
              ) : null}
              {isMobile ? (
                <TimetableDayList
                  monday={monday}
                  day={day}
                  onDayChange={(next) => void setDay(next)}
                  lessons={lessons}
                  now={now}
                  showSubgroup={hint}
                />
              ) : lessons.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("noLessonsWeek")}</p>
              ) : (
                <TimetableWeekGrid monday={monday} lessons={lessons} now={now} showSubgroup={hint} />
              )}
            </>
          )
        }}
      </QueryState>
    </PageContainer>
  )
}
