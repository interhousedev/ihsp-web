"use client"

import { useFormatters, useLocale, useNow, useT } from "@ihsp/i18n"
import {
  Button,
  Gantt,
  type GanttItem,
  type GanttRow,
  ResponsiveDialog,
  Skeleton,
  StateView,
  TooltipProvider,
  ToggleGroup,
  ToggleGroupItem,
  UserAvatar,
} from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { QueryError } from "../../shell/components/query-error"
import { useCaseloadDeadlines, type CaseloadScope } from "../api"
import { utcDayToIso } from "../gantt-model"
import { groupByStudent, timelineRange, type StudentTimeline } from "../staff-timeline-model"
import { fitWidth } from "./deadlines-gantt"

/**
 * Caseload timeline: one group per student (avatar, name, group) with every dated item as a flag on the heading row.
 * A flag marked with the staff letter holds a task a staff member set. Admins switch between their own students and all.
 */
export function StaffCaseloadTimeline({ canSeeAll }: { canSeeAll: boolean }) {
  const t = useT("deadlines.staffTimeline")
  const tg = useT("deadlines.gantt")
  const locale = useLocale()
  const { date } = useFormatters()
  const now = useNow({ updateInterval: 60_000 })
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const [scope, setScope] = useState<CaseloadScope>("mine")
  const [selected, setSelected] = useState<string | null>(null)
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const [boxWidth, setBoxWidth] = useState(0)
  useEffect(() => {
    if (!box) return
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry?.contentRect.width ?? 0))
    observer.observe(box)
    setBoxWidth(box.clientWidth)
    return () => observer.disconnect()
  }, [box])
  const query = useCaseloadDeadlines(canSeeAll ? scope : "mine")
  const students = useMemo(() => groupByStudent(query.data ?? [], today), [query.data, today])
  const range = useMemo(() => timelineRange(students, today), [students, today])
  const fmt = (time: number, options: Intl.DateTimeFormatOptions) =>
    date(`${utcDayToIso(time)}T12:00:00+05:00`, options)
  const day = (time: number) => fmt(time, { day: "numeric", month: "short" })
  const flagId = (student: StudentTimeline, at: number) => `${student.studentId}:${at}`

  const flag = (student: StudentTimeline, entry: StudentTimeline["days"][number]): GanttItem => ({
    id: flagId(student, entry.day),
    start: entry.day,
    end: entry.day,
    tone: entry.tone,
    shape: "flag",
    label: entry.items[0]!.title,
    short: entry.byStaff ? t("staffShort") : undefined,
    count: entry.items.length,
    past: entry.day < today,
    ariaLabel: `${student.name ?? t("unknownStudent")}: ${
      entry.items.length > 1
        ? tg("dayCount", { count: entry.items.length, date: day(entry.day) })
        : `${entry.items[0]!.title}, ${day(entry.day)}`
    }`,
    tooltip: (
      <>
        <span className="text-[11px] opacity-80">{day(entry.day)}</span>
        {entry.items.map((item) => (
          <span key={`${item.kind}:${item.title}:${item.href}`} className="flex flex-col">
            <span className="font-medium">{item.title}</span>
            {item.by_staff ? <span className="opacity-80">{t("byStaff")}</span> : null}
          </span>
        ))}
      </>
    ),
  })

  const rows: GanttRow[] = students.map((s) => ({
    id: `${s.studentId}:heading`,
    label: "",
    group: s.studentId,
    items: [],
  }))
  const groups = Object.fromEntries(students.map((s) => [s.studentId, s.name ?? t("unknownStudent")]))
  const groupItems = Object.fromEntries(students.map((s) => [s.studentId, s.days.map((d) => flag(s, d))]))
  const groupIcons = Object.fromEntries(
    students.map((s) => [s.studentId, <UserAvatar key={s.studentId} name={s.name ?? "?"} className="size-6" />]),
  )
  const groupActions = Object.fromEntries(
    students.map((s) => [
      s.studentId,
      <Link
        key={s.studentId}
        href={`/staff/students/view/?id=${s.studentId}`}
        className="text-primary shrink-0 text-[11px] font-medium hover:underline"
        aria-label={t("openStudent", { name: s.name ?? t("unknownStudent") })}
      >
        {t("open")}
      </Link>,
    ]),
  )
  const open = selected
    ? students.flatMap((s) => s.days.map((d) => ({ s, d }))).find(({ s, d }) => flagId(s, d.day) === selected)
    : undefined
  const panelWidth = boxWidth || (typeof window === "undefined" ? 1024 : window.innerWidth)
  const sidebar = panelWidth < 640 ? 136 : 200

  let body
  if (query.isPending) body = <Skeleton className="h-[50dvh] w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (students.length === 0)
    body = <StateView state="empty" title={scope === "all" && canSeeAll ? t("emptyAll") : t("empty")} />
  else
    body = (
      <TooltipProvider delay={120}>
        <Gantt
          className="max-h-[calc(100dvh-14rem)] min-h-[280px]"
          rows={rows}
          groups={groups}
          groupActions={groupActions}
          groupItems={groupItems}
          groupIcons={groupIcons}
          start={range.start}
          end={range.end}
          today={today}
          dayWidth={fitWidth(panelWidth, sidebar, range.start, range.end)}
          sidebarWidth={sidebar}
          todayLabel={tg("today")}
          ariaLabel={t("label")}
          monthLabel={(time) =>
            fmt(time, { month: "long", year: "numeric" }).replace(/^\p{L}/u, (c) => c.toLocaleUpperCase(locale))
          }
          dayLabel={day}
          weekdayLabel={(time) => fmt(time, { weekday: "short" })}
          onSelect={setSelected}
        />
      </TooltipProvider>
    )

  return (
    <div ref={setBox} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {canSeeAll ? (
          <ToggleGroup
            value={[scope]}
            onValueChange={(value) => value[0] && setScope(value[0] as CaseloadScope)}
            aria-label={t("scope")}
            variant="outline"
          >
            <ToggleGroupItem value="mine" className="min-h-11 px-3 md:min-h-8">
              {t("scopeMine")}
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="min-h-11 px-3 md:min-h-8">
              {t("scopeAll")}
            </ToggleGroupItem>
          </ToggleGroup>
        ) : (
          <span />
        )}
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <span className="bg-info text-white rounded px-1 text-[10px] font-semibold">{t("staffShort")}</span>
          {t("byStaff")}
        </span>
      </div>
      {body}
      <ResponsiveDialog
        open={Boolean(open)}
        onOpenChange={(next) => !next && setSelected(null)}
        title={open ? `${open.s.name ?? t("unknownStudent")} · ${day(open.d.day)}` : ""}
      >
        {open ? (
          <ul className="flex flex-col gap-3">
            {open.d.items.map((item) => (
              <li
                key={`${item.kind}:${item.title}:${item.href}`}
                className="flex min-w-0 flex-col gap-1 rounded-lg border p-3 text-sm"
              >
                <span className="font-medium break-words">{item.title}</span>
                {item.by_staff ? <span className="text-muted-foreground text-xs">{t("byStaff")}</span> : null}
                <Button
                  render={<Link href={item.href} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="mt-1 min-h-11 w-fit md:min-h-8"
                >
                  {tg("openItem")}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </ResponsiveDialog>
    </div>
  )
}
