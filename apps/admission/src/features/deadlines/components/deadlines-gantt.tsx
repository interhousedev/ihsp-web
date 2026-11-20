"use client"

import { useFormatters, useLocale, useNow, useT } from "@ihsp/i18n"
import {
  Button,
  Gantt,
  type GanttItem,
  type GanttRow,
  Icons,
  ResponsiveDialog,
  Skeleton,
  StateView,
  ToggleGroup,
  ToggleGroupItem,
  TooltipProvider,
} from "@ihsp/ui"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useTasks } from "../../tasks/api"
import { scoreName, useScoreCatalog, useScores } from "../../test-scores/api"
import { useCalendar } from "../calendar-api"
import { type Block, type Entry, toBlocks, chartRange, utcDay, utcDayToIso } from "../gantt-model"

const DAY = 86_400_000
const ZOOM = { year: 8, month: 22, week: 44 } as const
type Zoom = keyof typeof ZOOM

/** The deadlines page body: tasks, exams and every dated deadline as blocks on one timeline (the library Gantt). */
export function DeadlinesGantt({ onSettings }: { onSettings: () => void }) {
  const t = useT("deadlines.gantt")
  const tc = useT("deadlines.calendar")
  const tt = useT("tasks")
  const locale = useLocale()
  const { date } = useFormatters()
  const now = useNow({ updateInterval: 60_000 })
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const [zoom, setZoom] = useState<Zoom>("month")
  const [selected, setSelected] = useState<string | null>(null)
  const tasks = useTasks()
  const scores = useScores()
  const catalog = useScoreCatalog()
  const range = useMemo(
    () => ({ from: utcDayToIso(today - 30 * DAY), to: utcDayToIso(today + 400 * DAY) }),
    [today],
  )
  const calendar = useCalendar(range.from, range.to)
  const fmt = (time: number, options: Intl.DateTimeFormatOptions) =>
    // The shared formatter owns the uz month names (plain Intl answers "M10" there).
    date(`${utcDayToIso(time)}T12:00:00+05:00`, options)
  const day = (time: number) => fmt(time, { day: "numeric", month: "short" })

  const blocks = useMemo(() => {
    const names = new Map((catalog.data?.items ?? []).map((test) => [test.id, scoreName(test.names, locale)]))
    const entries: Entry[] = []
    for (const task of tasks.data?.items ?? []) {
      if (!task.deadline) continue
      const end = utcDay(task.deadline)
      entries.push({
        id: `task:${task.id}`,
        rowId: `task:${task.id}`,
        rowLabel: task.title,
        group: "tasks",
        kind: "task",
        title: task.title,
        start: task.start_date ? Math.min(utcDay(task.start_date), end) : end,
        end,
        tone: task.overdue ? "danger" : task.status === "done" ? "success" : "primary",
        href: "/tasks/",
        caption: tt(`status.${task.status}`),
      })
    }
    for (const entry of scores.data?.entries ?? []) {
      const name = names.get(entry.test_id) || entry.test_id
      const title = entry.label && entry.label !== name ? `${name} · ${entry.label}` : name
      const done = entry.status === "score_received" || entry.status === "taken"
      if (entry.test_date) {
        const at = utcDay(entry.test_date)
        entries.push({
          id: `test:${entry.id}`,
          rowId: `test:${entry.id}`,
          rowLabel: title,
          group: "tests",
          kind: "test",
          title,
          start: at,
          end: at,
          tone: done ? "success" : "warning",
          href: "/tests/",
          caption: t("exam"),
        })
      }
      if (entry.registration_deadline) {
        const at = utcDay(entry.registration_deadline)
        entries.push({
          id: `reg:${entry.id}`,
          rowId: `test:${entry.id}`,
          rowLabel: title,
          group: "tests",
          kind: "registration",
          title,
          start: at,
          end: at,
          tone: "danger",
          href: "/tests/",
          caption: t("registrationCloses"),
        })
      }
    }
    for (const item of calendar.data?.items ?? []) {
      const at = utcDay(item.day)
      entries.push({
        id: `cal:${item.key}`,
        rowId: `cal:${item.source}`,
        rowLabel: tc(`sources.${item.source}`),
        group: "deadlines",
        kind: "deadline",
        title: item.title,
        start: at,
        end: at,
        tone: item.predicted ? "muted" : "warning",
        href: item.url_path,
        caption: item.predicted ? `${tc(`sources.${item.source}`)} · ${t("predicted")}` : tc(`sources.${item.source}`),
        predicted: item.predicted,
      })
    }
    return toBlocks(entries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.data, scores.data, catalog.data, calendar.data, locale])

  const view = useMemo(() => {
    const order = ["tasks", "tests", "deadlines"] as const
    const byRow = new Map<string, Block[]>()
    for (const block of blocks) byRow.set(block.rowId, [...(byRow.get(block.rowId) ?? []), block])
    const rows = [...byRow.values()]
      .sort(
        (a, b) =>
          order.indexOf(a[0]!.group) - order.indexOf(b[0]!.group) ||
          Math.min(...a.map((block) => block.start)) - Math.min(...b.map((block) => block.start)),
      )
      .map((list) => ({ list, first: list[0]! }))
    return { rows, blocks: new Map(blocks.map((block) => [block.id, block])), ...chartRange(blocks, today) }
  }, [blocks, today])

  const kindLabel = (entry: Entry) =>
    entry.kind === "registration" ? t("registrationCloses") : entry.kind === "test" ? t("exam") : entry.caption
  const range1 = (block: Block) =>
    block.start === block.end ? day(block.start) : `${day(block.start)} – ${day(block.end)}`
  const lines = (block: Block) =>
    block.entries.map((entry) => (
      <span key={entry.id} className="flex flex-col">
        <span className="font-medium">{entry.title}</span>
        <span className="opacity-80">{kindLabel(entry)}</span>
      </span>
    ))
  const item = (block: Block): GanttItem => {
    const first = block.entries[0]!
    const many = block.entries.length > 1
    return {
      id: block.id,
      start: block.start,
      end: block.end,
      tone: block.tone,
      shape: block.shape,
      label: first.title,
      count: block.entries.length,
      ariaLabel: many
        ? t("dayCount", { count: block.entries.length, date: day(block.start) })
        : `${first.title}, ${range1(block)}`,
      tooltip: (
        <>
          <span className="text-[11px] opacity-80">{range1(block)}</span>
          {many ? (
            <span className="font-medium">{t("dayCount", { count: block.entries.length, date: day(block.start) })}</span>
          ) : null}
          {lines(block)}
        </>
      ),
    }
  }
  const rows: GanttRow[] = view.rows.map(({ list, first }) => ({
    id: first.rowId,
    label: first.rowLabel,
    group: first.group,
    items: list.map(item),
  }))
  const open = selected ? view.blocks.get(selected) : undefined

  if (tasks.isPending || scores.isPending) return <Skeleton className="h-[60dvh] w-full" />
  if (tasks.isError) return <StateView state="error" error={tasks.error} onRetry={() => void tasks.refetch()} />

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          value={[zoom]}
          onValueChange={(value) => value[0] && setZoom(value[0] as Zoom)}
          aria-label={t("zoom")}
          variant="outline"
        >
          {(Object.keys(ZOOM) as Zoom[]).map((key) => (
            <ToggleGroupItem key={key} value={key} className="min-h-11 px-3 md:min-h-8">
              {t(`zoomLevel.${key}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="outline" onClick={onSettings} className="min-h-11 md:min-h-8">
          <Icons.notification aria-hidden />
          {t("reminders")}
        </Button>
      </div>
      {rows.length === 0 ? (
        <StateView state="empty" title={t("empty")} />
      ) : (
        <TooltipProvider delay={120}>
          <Gantt
            key={zoom}
            className="min-h-[360px] flex-1 md:max-h-[calc(100dvh-14rem)]"
            rows={rows}
            groups={{ tasks: t("tasks"), tests: t("tests"), deadlines: t("deadlines") }}
            start={view.start}
            end={view.end}
            today={today}
            dayWidth={ZOOM[zoom]}
            sidebarWidth={typeof window !== "undefined" && window.innerWidth < 640 ? 104 : 168}
            todayLabel={t("today")}
            ariaLabel={t("label")}
            monthLabel={(time) => fmt(time, { month: "long", year: "numeric" }).replace(/^\p{L}/u, (c) => c.toLocaleUpperCase(locale))}
            dayLabel={day}
            weekdayLabel={(time) => fmt(time, { weekday: "short" })}
            onSelect={setSelected}
          />
        </TooltipProvider>
      )}
      <ResponsiveDialog
        open={Boolean(open)}
        onOpenChange={(next) => !next && setSelected(null)}
        title={open ? (open.entries.length > 1 ? t("dayCount", { count: open.entries.length, date: day(open.start) }) : open.entries[0]!.title) : ""}
      >
        {open ? (
          <ul className="flex flex-col gap-3">
            {open.entries.map((entry) => (
              <li key={entry.id} className="flex min-w-0 flex-col gap-1 rounded-lg border p-3 text-sm">
                <span className="font-medium break-words">{entry.title}</span>
                <span className="text-muted-foreground text-xs">
                  {kindLabel(entry)} · {entry.start === entry.end ? day(entry.start) : `${day(entry.start)} – ${day(entry.end)}`}
                </span>
                {entry.href ? (
                  <Link href={entry.href} className="text-primary mt-1 w-fit text-sm font-medium hover:underline">
                    {t("openItem")}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </ResponsiveDialog>
    </div>
  )
}
