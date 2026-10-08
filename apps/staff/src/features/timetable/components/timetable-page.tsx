"use client"

import { getStaffTimetableQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, useIsMobile } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { QueryState } from "../../shared/components/query-state"
import { useNow } from "../../shared/hooks/use-now"
import { mondayOf, selectedDay, weekRange } from "../utils/week"
import { TimetableDayList } from "./timetable-day-list"
import { TimetableWeekGrid } from "./timetable-week-grid"
import { WeekSwitcher } from "./week-switcher"

/**
 * Timetable (STF-3, UF-STF-03): the teacher's week as a grid on desktop and a day list on phones, with warnings for
 * past lessons without attendance. `?week=` (a Monday) and `?day=` keep the view in the address.
 */
export function TimetablePage() {
  const t = useT("timetable")
  const isMobile = useIsMobile()
  const now = useNow()
  const [weekParam, setWeek] = useQueryState("week", parseAsString)
  const [dayParam, setDay] = useQueryState("day", parseAsString)
  const monday = mondayOf(weekParam)
  const day = selectedDay(monday, dayParam)
  const query = useQuery(getStaffTimetableQuery(weekRange(monday)))

  return (
    <PageContainer title={t("title")} description={t("description")}>
      <WeekSwitcher
        monday={monday}
        onChange={(next) => {
          void setWeek(next)
          void setDay(null)
        }}
      />
      <QueryState query={query} rows={4}>
        {(lessons) =>
          isMobile ? (
            <TimetableDayList
              monday={monday}
              day={day}
              onDayChange={(next) => void setDay(next)}
              lessons={lessons}
              now={now}
            />
          ) : lessons.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noLessonsWeek")}</p>
          ) : (
            <TimetableWeekGrid monday={monday} lessons={lessons} now={now} />
          )
        }
      </QueryState>
    </PageContainer>
  )
}
