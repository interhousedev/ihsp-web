"use client"

import { useFormatters, useLocale, useNow, useT } from "@ihsp/i18n"
import { cn, Icons, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useMemo, useRef } from "react"
import { useTasks } from "../../tasks/api"
import { scoreName, useScoreCatalog, useScores } from "../../test-scores/api"
import { useCalendar } from "../calendar-api"
import {
  buildGantt,
  mondayOf,
  utcDay,
  WEEK_MS,
  type GanttBar,
  type GanttMarker,
  type GanttModel,
} from "../prep-gantt-model"

const WEEK_PX = 88
const LABEL_PX = 120
const BAR_TONE = {
  primary: "bg-primary/15 border-primary/60",
  success: "bg-success/15 border-success/60",
  danger: "bg-destructive/15 border-destructive/60",
  warning: "bg-warning/20 border-warning/70",
} as const

function Row({ label, children, model }: { label: string; children: React.ReactNode; model: GanttModel }) {
  return (
    <div className="flex items-center" style={{ minWidth: LABEL_PX + model.weeks.length * WEEK_PX }}>
      <span
        className="bg-background text-muted-foreground sticky left-0 z-20 shrink-0 truncate pr-3 text-xs font-medium"
        style={{ width: LABEL_PX }}
        title={label}
      >
        {label}
      </span>
      <div className="relative h-8 flex-1">{children}</div>
    </div>
  )
}

/** Weeks across the top; prep tasks and tests as bars; deadlines as markers; a line for today. */
export function PrepGantt() {
  const t = useT("deadlines.gantt")
  const locale = useLocale()
  const { date } = useFormatters()
  const now = useNow({ updateInterval: 60_000 })
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const scroller = useRef<HTMLDivElement>(null)
  const tasks = useTasks()
  const scores = useScores()
  const catalog = useScoreCatalog()
  const range = useMemo(
    () => ({
      from: new Date(mondayOf(today) - 4 * WEEK_MS).toISOString().slice(0, 10),
      to: new Date(today + 52 * WEEK_MS).toISOString().slice(0, 10),
    }),
    [today],
  )
  const calendar = useCalendar(range.from, range.to)

  const model = useMemo(() => {
    const names = new Map((catalog.data?.items ?? []).map((test) => [test.id, scoreName(test.names, locale)]))
    const bars: GanttBar[] = []
    for (const task of tasks.data?.items ?? []) {
      if (!task.deadline) continue
      const end = utcDay(task.deadline)
      bars.push({
        key: `task:${task.id}`,
        kind: "task",
        title: task.title,
        begin: task.start_date ? Math.min(utcDay(task.start_date), end) : end,
        end,
        tone: task.overdue ? "danger" : task.status === "done" ? "success" : "primary",
        href: "/tasks/",
      })
    }
    const markers: GanttMarker[] = []
    for (const entry of scores.data?.entries ?? []) {
      const name = names.get(entry.test_id) || entry.test_id
      const title = entry.label && entry.label !== name ? `${name} · ${entry.label}` : name
      if (entry.test_date) {
        const at = utcDay(entry.test_date)
        bars.push({
          key: `test:${entry.id}`,
          kind: "test",
          title,
          begin: at,
          end: at,
          tone: entry.status === "score_received" || entry.status === "taken" ? "success" : "warning",
          href: "/tests/",
        })
      }
      if (entry.registration_deadline) {
        markers.push({
          key: `reg:${entry.id}`,
          title,
          at: utcDay(entry.registration_deadline),
          href: "/tests/",
          kind: "registration",
        })
      }
    }
    for (const item of calendar.data?.items ?? []) {
      markers.push({
        key: item.key,
        title: item.title,
        at: utcDay(item.day),
        href: item.url_path ?? "/deadlines/",
        kind: "deadline",
      })
    }
    return buildGantt(bars, markers, today)
  }, [tasks.data, scores.data, catalog.data, calendar.data, locale, today])

  const ready = !tasks.isPending && !scores.isPending
  const hasData = model.bars.length > 0 || model.markers.length > 0
  useEffect(() => {
    const node = scroller.current
    if (!node) return
    const first = Math.min(...model.bars.map((bar) => bar.begin), ...model.markers.map((m) => m.at))
    const anchor = today >= model.start && today < model.start + model.span ? today : first
    const x = ((anchor - model.start) / WEEK_MS) * WEEK_PX
    node.scrollLeft = Math.max(0, x - node.clientWidth / 3)
  }, [ready, hasData, today, model.start, model.span, model.bars, model.markers])

  if (tasks.isPending || scores.isPending) return <Skeleton className="h-48 w-full" />
  if (model.bars.length === 0 && model.markers.length === 0)
    return <p className="text-muted-foreground text-sm">{t("empty")}</p>

  const pct = (time: number) => ((time - model.start) / model.span) * 100
  const weekLabel = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" })
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" })
  const months: { start: number; count: number; label: string }[] = []
  for (const week of model.weeks) {
    const key = new Date(week + 3 * 86_400_000)
    const last = months[months.length - 1]
    if (last && monthLabel.format(last.start) === monthLabel.format(key)) last.count += 1
    else months.push({ start: key.getTime(), count: 1, label: monthLabel.format(key) })
  }
  const shortMonth = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  const inTrack = today >= model.start && today < model.start + model.span
  const taskBars = model.bars.filter((bar) => bar.kind === "task")
  const testBars = model.bars.filter((bar) => bar.kind === "test")
  const deadlines = model.markers
  const width = LABEL_PX + model.weeks.length * WEEK_PX
  const gridStyle = {
    backgroundImage: "linear-gradient(to right, var(--color-border) 1px, transparent 1px)",
    backgroundSize: `${WEEK_PX}px 100%`,
  }

  return (
    <div ref={scroller} className="overflow-x-auto rounded-card border" role="region" aria-label={t("label")}>
      <div className="relative flex flex-col gap-2 p-3" style={{ width: width + 24 }}>
        <div className="flex" style={{ width }}>
          <span className="bg-background sticky left-0 z-20 shrink-0" style={{ width: LABEL_PX }} />
          <div className="text-foreground flex flex-1 text-xs font-semibold">
            {months.map((month) => (
              <span
                key={month.start}
                style={{ width: month.count * WEEK_PX }}
                className="bg-muted/50 shrink-0 border-l"
              >
                <span className="sticky inline-block px-1.5 py-0.5 whitespace-nowrap" style={{ left: LABEL_PX }}>
                  {(month.count < 3 ? shortMonth.format(month.start) : month.label).replace(/^\p{L}/u, (c) =>
                    c.toLocaleUpperCase(locale),
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex" style={{ width }}>
          <span className="bg-background sticky left-0 z-20 shrink-0" style={{ width: LABEL_PX }} />
          <div className="text-muted-foreground flex flex-1 text-xs">
            {model.weeks.map((week) => (
              <span
                key={week}
                style={{ width: WEEK_PX }}
                className="shrink-0 border-l"
                title={t("week", { date: weekLabel.format(week) })}
              >
                <span className="sticky inline-block pl-1.5 whitespace-nowrap" style={{ left: LABEL_PX }}>
                  {weekLabel.format(week)}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="relative mt-4 flex flex-col gap-2" style={{ width }}>
          <div
            className="pointer-events-none absolute inset-y-0 right-0"
            style={{ left: LABEL_PX, ...gridStyle }}
            aria-hidden
          />
          {inTrack ? (
            <div
              className="pointer-events-none absolute inset-y-0 z-10"
              style={{ left: LABEL_PX, right: 0 }}
              aria-hidden
            >
              <span className="bg-destructive absolute inset-y-0 w-0.5" style={{ left: `${pct(today)}%` }}>
                <span className="bg-destructive text-destructive-foreground absolute -top-5 left-1/2 -translate-x-1/2 rounded px-1 text-xs whitespace-nowrap">
                  {t("today")}
                </span>
              </span>
            </div>
          ) : null}
          {taskBars.map((bar) => (
            <Row key={bar.key} label={bar.title} model={model}>
              <BarLink
                bar={bar}
                left={pct(bar.begin)}
                width={((bar.end + 86_400_000 - bar.begin) / model.span) * 100}
                label={t("task", {
                  title: bar.title,
                  start: date(new Date(bar.begin).toISOString().slice(0, 10)),
                  end: date(new Date(bar.end).toISOString().slice(0, 10)),
                })}
              />
            </Row>
          ))}
          {testBars.map((bar) => (
            <Row key={bar.key} label={bar.title} model={model}>
              <BarLink
                bar={bar}
                left={pct(bar.begin)}
                width={(86_400_000 / model.span) * 100}
                text={`${bar.title} · ${date(new Date(bar.begin).toISOString().slice(0, 10))}`}
                label={t("test", { title: bar.title, date: date(new Date(bar.begin).toISOString().slice(0, 10)) })}
              />
            </Row>
          ))}
          {deadlines.length > 0 ? (
            <Row label={t("deadlines")} model={model}>
              {deadlines.map((marker) => {
                const day = date(new Date(marker.at).toISOString().slice(0, 10))
                return (
                  <Link
                    key={marker.key}
                    href={marker.href}
                    aria-label={t(marker.kind === "registration" ? "registration" : "deadline", {
                      title: marker.title,
                      date: day,
                    })}
                    title={marker.title}
                    className="text-destructive absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pct(marker.at + 43_200_000)}%` }}
                  >
                    <Icons.flag
                      aria-hidden
                      className={cn("size-5", marker.kind === "registration" && "text-warning")}
                    />
                  </Link>
                )
              })}
            </Row>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function BarLink({
  bar,
  left,
  width,
  label,
  text,
}: {
  bar: GanttBar
  left: number
  width: number
  label: string
  text?: string
}) {
  return (
    <Link
      href={bar.href}
      aria-label={label}
      title={label}
      className={cn(
        "text-foreground absolute top-0.5 z-10 flex h-7 min-w-3 items-center rounded-md border text-xs font-medium",
        BAR_TONE[bar.tone],
      )}
      style={{ left: `${left}%`, width: `${Math.max(width, 0.4)}%` }}
    >
      <span className="pointer-events-none px-1.5 whitespace-nowrap">{text ?? bar.title}</span>
    </Link>
  )
}
