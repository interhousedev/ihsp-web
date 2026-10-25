"use client"

import { getMeLessonResultsQuery, getMeTimetableQuery, type LessonResult, type StudentLessonItem } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconBooks,
  IconNotebook,
  IconSchool,
  Icons,
  MarkBadge,
  NavIconView,
  PageContainer,
  Skeleton,
  cn,
} from "@ihsp/ui"
import type { NavIcon } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo } from "react"
import { useNav } from "../../../config/nav"
import { QueryState } from "../../shared/components/query-state"
import { useNow } from "../../shared/hooks/use-now"
import { shortName } from "../../shared/utils/people"
import { useToday } from "../../today/hooks/use-today"

/**
 * The Dashboard, the landing page: today's lessons (each a link to its lesson, with the mark and a notebook link), the
 * semester GPA and links to every section of the app and to the library and LMS.
 */
export function DashboardPage() {
  const t = useT("dashboard")
  const f = useFormatters()
  const now = useNow(60_000)
  return (
    <PageContainer title={t("title")} description={f.date(now, { weekday: "long", day: "numeric", month: "long" })}>
      <div className="flex flex-col gap-4">
        <TodayLessons now={now} />
        <GpaCard />
        <SectionLinks />
      </div>
    </PageContainer>
  )
}

function TodayLessons({ now }: { now: number }) {
  const t = useT("dashboard")
  const day = todayIso()
  const range = { from: day, to: day }
  const lessons = useQuery(getMeTimetableQuery(range))
  const resultRows = useQuery(getMeLessonResultsQuery(range)).data
  const results = useMemo(() => new Map((resultRows ?? []).map((row) => [row.lesson_id, row])), [resultRows])
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle id="dashboard-lessons">{t("lessons")}</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState
          query={lessons}
          rows={3}
          isEmpty={(data) => data.length === 0}
          emptyText={t("noLessons")}
          emptyAction={
            <Link href="/timetable/" className="text-primary text-sm underline-offset-4 hover:underline">
              {t("openCalendar")}
            </Link>
          }
        >
          {(data) => (
            <ul aria-labelledby="dashboard-lessons" className="flex flex-col divide-y">
              {data
                .toSorted((a, b) => a.starts_at.localeCompare(b.starts_at))
                .map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} result={results.get(lesson.id)} now={now} />
                ))}
            </ul>
          )}
        </QueryState>
      </CardContent>
    </Card>
  )
}

/** One lesson: time, subject, room and teacher, the mark, the other subgroup's label (as in the calendar). */
function LessonRow({ lesson, result, now }: { lesson: StudentLessonItem; result?: LessonResult; now: number }) {
  const t = useT("dashboard")
  const tt = useT("timetable")
  const f = useFormatters()
  const cancelled = lesson.status === "cancelled"
  const otherSubgroup = lesson.subgroup?.is_own_subgroup === false ? lesson.subgroup : null
  const current = !cancelled && Date.parse(lesson.starts_at) <= now && now < Date.parse(lesson.ends_at)
  const mark = !cancelled ? (result?.mark ?? null) : null
  const place = [
    lesson.room?.name ? tt("room", { name: lesson.room.name }) : null,
    lesson.teacher ? shortName(lesson.teacher) : null,
  ]
  return (
    <li
      data-other-subgroup={otherSubgroup ? true : undefined}
      className={cn("flex items-center gap-2 py-2", otherSubgroup && "opacity-60", cancelled && "opacity-60")}
    >
      <Link
        href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
        aria-current={current ? "true" : undefined}
        className="hover:bg-accent focus-visible:ring-ring flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-md px-1 outline-none focus-visible:ring-2"
      >
        <span className="text-muted-foreground w-11 shrink-0 text-sm tabular-nums">{f.time(lesson.starts_at)}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn("truncate font-medium", cancelled && "line-through")}>{lesson.subject.name}</span>
          {place.some(Boolean) ? (
            <span className="text-muted-foreground truncate text-xs">{place.filter(Boolean).join(" · ")}</span>
          ) : null}
          {otherSubgroup || cancelled || current ? (
            <span className="mt-0.5 flex flex-wrap gap-1">
              {current ? <Badge>{tt("now")}</Badge> : null}
              {cancelled ? <Badge variant="destructive">{tt("cancelled")}</Badge> : null}
              {otherSubgroup ? (
                <Badge variant="outline">{tt("otherSubgroup", { name: otherSubgroup.subgroup_name })}</Badge>
              ) : null}
            </span>
          ) : null}
        </span>
        {mark !== null ? (
          <span role="img" aria-label={t("mark", { mark })}>
            <MarkBadge mark={mark} size="sm" />
          </span>
        ) : null}
      </Link>
      {/* A real link: the notebook page creates the subject notebook on first open, so nothing is made in advance. */}
      <Link
        href={`/notebooks/view/?subject=${encodeURIComponent(lesson.subject.id)}`}
        aria-label={t("notebook", { subject: lesson.subject.name })}
        title={t("notebook", { subject: lesson.subject.name })}
        className="hover:bg-accent focus-visible:ring-ring text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-2"
      >
        <IconNotebook className="size-5" aria-hidden />
      </Link>
    </li>
  )
}

/** The semester GPA on the 5-point scale (the Today summary's source), a link to Grades. */
function GpaCard() {
  const t = useT("dashboard")
  const today = useToday()
  const gpa = today.data?.semester.gpa ?? null
  return (
    <Link
      href="/grades/"
      aria-label={t("gpaLabel", { value: gpa === null ? "–" : gpa.toFixed(2) })}
      className="bg-card hover:bg-accent focus-visible:ring-ring flex min-h-16 items-center gap-3 rounded-xl border p-4 outline-none focus-visible:ring-2"
    >
      <span className="flex flex-1 flex-col">
        <span className="text-muted-foreground text-sm">{t("gpa")}</span>
        {today.isPending ? (
          <Skeleton className="h-7 w-20" />
        ) : today.isError && !today.data ? (
          <span className="text-muted-foreground text-sm">{t("gpaError")}</span>
        ) : (
          <span className="text-2xl font-semibold tabular-nums">
            {gpa === null ? "–" : gpa.toFixed(2)}
            <span className="text-muted-foreground text-base font-normal"> / 5</span>
          </span>
        )}
      </span>
      <span className="text-primary text-sm">{t("toGrades")}</span>
      <Icons.chevronRight className="text-muted-foreground size-4" aria-hidden />
    </Link>
  )
}

type SectionLink = { title: string; url: string; icon?: NavIcon; external?: boolean }

/** Every page of the navigation except this one, then the library and the LMS (runtime config URLs). */
function SectionLinks() {
  const t = useT("dashboard")
  const nav = useNav()
  const config = getConfig()
  const links: SectionLink[] = [
    ...nav.groups.flatMap((group) => group.items).filter((item) => item.url !== "/"),
    { title: t("library"), url: config.LIBRARY_URL ?? "https://lib.ihsu.uz", icon: IconBooks, external: true },
    { title: t("lms"), url: config.LMS_URL, icon: IconSchool, external: true },
  ]
  return (
    <nav aria-label={t("sections")}>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {links.map((item) => {
          const className =
            "bg-card hover:bg-accent focus-visible:ring-ring flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center text-xs font-medium outline-none focus-visible:ring-2"
          const body = (
            <>
              <NavIconView icon={item.icon} className="text-primary size-6" />
              <span className="line-clamp-2">{item.title}</span>
            </>
          )
          return (
            <li key={item.url}>
              {item.external ? (
                <a href={item.url} className={className}>
                  {body}
                </a>
              ) : (
                <Link href={item.url} className={className}>
                  {body}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
