"use client"

import { useFormatters, useLocale, useNow, useT } from "@ihsp/i18n"
import type { ReactNode } from "react"
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
import { useList } from "../../chooser/hooks"
import { useTasks } from "../../tasks/api"
import type { TaskPrefill } from "../../tasks/components/task-form-dialog"
import { scoreName, useScoreCatalog, useScores } from "../../test-scores/api"
import { useCalendar } from "../calendar-api"
import {
  type Block,
  type Entry,
  chartRange,
  institutionUrl,
  toBlocks,
  utcDay,
  utcDayToIso,
} from "../gantt-model"
import { PrefsForm } from "./prefs-form"
import { CalendarFeed } from "./calendar-feed"

const DAY = 86_400_000
const ZOOM = { year: 8, month: 22, week: 44 } as const
type Zoom = keyof typeof ZOOM

const GENERAL = "general"
const MINE = "mine"
const uniGroup = (entryId: string) => `uni:${entryId}`

/**
 * The default view of the tasks page: every dated thing as blocks on one timeline (the library Gantt), grouped per
 * university on the list (its deadlines and its tasks), general (exams, scholarships, documents) and the student's
 * own tasks. A bar opens its task; a deadline offers to become a task. `onCreate` opens the new-task form.
 */
export function DeadlinesGantt({
  onOpenTask,
  onCreate,
}: {
  onOpenTask: (id: string) => void
  onCreate: (prefill: TaskPrefill) => void
}) {
  const t = useT("deadlines.gantt")
  const tc = useT("deadlines.calendar")
  const tt = useT("tasks")
  const tp = useT("deadlines")
  const locale = useLocale()
  const { date } = useFormatters()
  const now = useNow({ updateInterval: 60_000 })
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const [zoom, setZoom] = useState<Zoom>("month")
  const [selected, setSelected] = useState<string | null>(null)
  const [settings, setSettings] = useState(false)
  const tasks = useTasks()
  const list = useList()
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
    const listed = new Set((list.data ?? []).map((entry) => entry.id))
    const entries: Entry[] = []
    for (const task of tasks.data?.items ?? []) {
      const uni = task.list_entry_id && listed.has(task.list_entry_id) ? task.list_entry_id : null
      // An undated task of a university stays visible at the start of the chart, tagged "no due date".
      if (!task.deadline && !uni) continue
      const end = task.deadline ? utcDay(task.deadline) : today - 30 * DAY
      entries.push({
        id: `task:${task.id}`,
        rowId: `task:${task.id}`,
        rowLabel: task.title,
        group: uni ? uniGroup(uni) : MINE,
        kind: "task",
        taskId: task.id,
        title: task.title,
        start: task.start_date ? Math.min(utcDay(task.start_date), end) : end,
        end,
        tone: task.overdue ? "danger" : task.status === "done" ? "success" : "primary",
        href: "/tasks/",
        caption: task.deadline ? tt(`status.${task.status}`) : `${tt(`status.${task.status}`)} · ${t("noDeadline")}`,
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
          group: GENERAL,
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
          group: GENERAL,
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
      const uni = item.list_entry_id ?? null
      const inList = uni !== null && listed.has(uni)
      entries.push({
        id: `cal:${item.key}`,
        rowId: inList ? `${uniGroup(uni)}:deadlines` : `cal:${item.source}`,
        rowLabel: inList ? t("deadlines") : tc(`sources.${item.source}`),
        group: inList ? uniGroup(uni) : GENERAL,
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
  }, [tasks.data, scores.data, catalog.data, calendar.data, list.data, locale])

  const universities = useMemo(
    () => (list.data ?? []).map((entry) => ({ id: uniGroup(entry.id), entry: entry.id, name: entry.institution.name, institution: entry.institution })),
    [list.data],
  )
  const order = useMemo(() => [...universities.map((uni) => uni.id), GENERAL, MINE], [universities])
  const view = useMemo(() => {
    const byRow = new Map<string, Block[]>()
    for (const block of blocks) byRow.set(block.rowId, [...(byRow.get(block.rowId) ?? []), block])
    const first = (list: Block[]) => Math.min(...list.map((block) => block.start))
    const rows = [...byRow.values()]
      .sort(
        (a, b) =>
          order.indexOf(a[0]!.group) - order.indexOf(b[0]!.group) ||
          Number(b[0]!.rowId.endsWith(":deadlines")) - Number(a[0]!.rowId.endsWith(":deadlines")) ||
          first(a) - first(b),
      )
      .map((list) => ({ list, first: list[0]! }))
    return { rows, blocks: new Map(blocks.map((block) => [block.id, block])), ...chartRange(blocks, today) }
  }, [blocks, order, today])

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
  // A university with nothing dated yet still gets its heading, so its (+) is reachable.
  const withRows = new Set(rows.map((row) => row.group))
  const empty = universities.filter((uni) => !withRows.has(uni.id))
  const allRows: GanttRow[] = [
    ...empty.map((uni) => ({ id: `${uni.id}:none`, label: "", group: uni.id, items: [] })),
    ...rows,
  ].sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
  const groups: Record<string, string> = {
    [GENERAL]: t("general"),
    [MINE]: t("mine"),
    ...Object.fromEntries(universities.map((uni) => [uni.id, uni.name])),
  }
  const addTo = (label: string, prefill: TaskPrefill) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 md:size-7"
      aria-label={t("addTaskTo", { name: label })}
      title={t("addTaskTo", { name: label })}
      onClick={() => onCreate(prefill)}
    >
      <Icons.add aria-hidden className="size-4" />
    </Button>
  )
  // The nearest upcoming dated item of that university, so a new task is dated.
  const nearestDeadline = (entryId: string): string | null => {
    const from = utcDayToIso(today)
    const days = (calendar.data?.items ?? [])
      .filter((item) => item.list_entry_id === entryId && item.day >= from)
      .map((item) => item.day)
      .sort()
    return days[0] ?? null
  }
  const groupActions: Record<string, ReactNode> = {
    [MINE]: addTo(t("mine"), {}),
    ...Object.fromEntries(
      universities.map((uni) => [
        uni.id,
        addTo(uni.name, { list_entry_id: uni.entry, deadline: nearestDeadline(uni.entry), links: [{ kind: "internal", label: uni.name, url: institutionUrl(uni.institution.id) }] }),
      ]),
    ),
  }
  const uniLinks = (entry: Entry): TaskPrefill["links"] => {
    const uni = universities.find((candidate) => candidate.id === entry.group)
    return uni ? [{ kind: "internal", label: uni.name, url: institutionUrl(uni.institution.id) }] : []
  }
  const uniEntry = (entry: Entry) => universities.find((candidate) => candidate.id === entry.group)?.entry ?? null
  function select(id: string) {
    const block = view.blocks.get(id)
    const taskId = block?.entries.length === 1 ? block.entries[0]!.taskId : undefined
    if (taskId) onOpenTask(taskId)
    else setSelected(id)
  }
  const open = selected ? view.blocks.get(selected) : undefined

  if (tasks.isPending || scores.isPending || list.isPending) return <Skeleton className="h-[60dvh] w-full" />
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
        <Button variant="outline" onClick={() => setSettings(true)} className="min-h-11 md:min-h-8">
          <Icons.notification aria-hidden />
          {t("reminders")}
        </Button>
      </div>
      {allRows.length === 0 ? (
        <StateView state="empty" title={t("empty")} />
      ) : (
        <TooltipProvider delay={120}>
          <Gantt
            key={zoom}
            className="min-h-[360px] flex-1 md:max-h-[calc(100dvh-14rem)]"
            rows={allRows}
            groups={groups}
            groupActions={groupActions}
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
            onSelect={select}
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
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {entry.href ? (
                    <Link href={entry.href} className="text-primary min-h-11 content-center text-sm font-medium hover:underline md:min-h-0">
                      {t("openItem")}
                    </Link>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 md:min-h-8"
                    onClick={() => {
                      setSelected(null)
                      onCreate({
                        title: entry.kind === "registration" ? `${entry.title}: ${t("registrationCloses")}` : entry.title,
                        deadline: utcDayToIso(entry.end),
                        links: uniLinks(entry),
                        list_entry_id: uniEntry(entry),
                      })
                    }}
                  >
                    <Icons.add aria-hidden />
                    {t("createTask")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </ResponsiveDialog>
      <ResponsiveDialog open={settings} onOpenChange={setSettings} title={tp("prefsTitle")}>
        <div className="flex flex-col gap-4">
          <PrefsForm />
          <CalendarFeed />
        </div>
      </ResponsiveDialog>
    </div>
  )
}
