"use client"

import { useErrorMessage, useFormatters, useLocale, useNow, useT } from "@ihsp/i18n"
import type { ReactNode } from "react"
import {
  Button,
  Gantt,
  type GanttItem,
  type GanttRange,
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
import { useEffect, useMemo, useState } from "react"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { showProblemToast } from "../../../lib/problem-fields"
import { useList } from "../../chooser/hooks"
import { useMoveTask, useTasks } from "../../tasks/api"
import type { TaskPrefill } from "../../tasks/components/task-form-dialog"
import { scoreName, useScoreCatalog, useScores } from "../../test-scores/api"
import { useCalendar } from "../calendar-api"
import {
  type Block,
  type Entry,
  BACK_DAYS,
  chartRange,
  deadlineKind,
  institutionUrl,
  toBlocks,
  utcDay,
  utcDayToIso,
} from "../gantt-model"
import { PrefsForm } from "./prefs-form"
import { CalendarFeed } from "./calendar-feed"

const DAY = 86_400_000
/** Pixels a day takes on the fixed zoom levels; "fit" stretches the whole span to the width of the panel. */
const ZOOM = { month: 22, week: 44 } as const
const FIT_MIN = 5
const FIT_MAX = 30
type Zoom = "fit" | keyof typeof ZOOM
const ZOOMS: Zoom[] = ["fit", "month", "week"]

const GENERAL = "general"
const MINE = "mine"
const NONE = "none"
const HEADER_SUFFIX = ":head"
const KIND_TONE = {
  early: "warning",
  regular: "primary",
  aid: "info",
  test: "accent",
  document: "accent",
  opportunity: "accent",
  other: "accent",
} as const
const uniGroup = (entryId: string) => `uni:${entryId}`

/** Day width that puts the whole span inside the panel (never thinner than a readable minimum). */
export function fitWidth(panel: number, sidebar: number, start: number, end: number): number {
  const days = Math.round((end - start) / DAY) + 1
  return Math.min(FIT_MAX, Math.max(FIT_MIN, (panel - sidebar - 2) / days))
}

/**
 * The default view of the tasks page: every dated thing as blocks on one timeline (the library Gantt), grouped per
 * university on the list (its deadlines and its tasks), general (exams, scholarships, documents) and the student's
 * own tasks. A bar opens its task; a deadline offers to become a task. `onCreate` opens the new-task form.
 */
export function DeadlinesGantt({
  onOpenTask,
  onCreate,
  focusEntry,
}: {
  onOpenTask: (id: string) => void
  onCreate: (prefill: TaskPrefill) => void
  /** List entry whose group is scrolled into view on load (the "tasks" link of the university list). */
  focusEntry?: string | null
}) {
  const t = useT("deadlines.gantt")
  const tc = useT("deadlines.calendar")
  const tt = useT("tasks")
  const tp = useT("deadlines")
  const locale = useLocale()
  const { date } = useFormatters()
  const now = useNow({ updateInterval: 60_000 })
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const errorMessage = useErrorMessage()
  const move = useMoveTask()
  const [zoom, setZoom] = useState<Zoom>("fit")
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const [boxWidth, setBoxWidth] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [settings, setSettings] = useState(false)
  const tasks = useTasks()
  const list = useList()
  const scores = useScores()
  const catalog = useScoreCatalog()
  // The calendar endpoint answers at most 400 days: a month back plus 370 ahead.
  const range = useMemo(() => ({ from: utcDayToIso(today - 30 * DAY), to: utcDayToIso(today + 370 * DAY) }), [today])
  const calendar = useCalendar(range.from, range.to)
  useEffect(() => {
    if (!box) return
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry?.contentRect.width ?? 0))
    observer.observe(box)
    setBoxWidth(box.clientWidth)
    return () => observer.disconnect()
  }, [box])
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
      const end = task.deadline ? utcDay(task.deadline) : today - BACK_DAYS * DAY
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
        caption: [
          task.deadline ? tt(`status.${task.status}`) : `${tt(`status.${task.status}`)} · ${t("noDeadline")}`,
          task.assigned_by_name ? tt("assignedBy", { name: task.assigned_by_name }) : null,
        ]
          .filter(Boolean)
          .join(" · "),
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
          tone: done ? "success" : "accent",
          href: "/tests/",
          caption: t("exam"),
          short: t("short.test"),
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
          short: t("short.registration"),
        })
      }
    }
    for (const item of calendar.data?.items ?? []) {
      const at = utcDay(item.day)
      const uni = item.list_entry_id ?? null
      const inList = uni !== null && listed.has(uni)
      const kind =
        item.source === "university"
          ? deadlineKind(item.title)
          : item.source === "exam"
            ? "test"
            : item.source === "checklist"
              ? "document"
              : "opportunity"
      entries.push({
        id: `cal:${item.key}`,
        // A university's deadlines sit on its heading row, not on a row of their own.
        rowId: inList ? `${uniGroup(uni)}${HEADER_SUFFIX}` : `cal:${item.source}`,
        rowLabel: tc(`sources.${item.source}`),
        group: inList ? uniGroup(uni) : GENERAL,
        kind: "deadline",
        title: item.title,
        start: at,
        end: at,
        tone: item.predicted ? "muted" : KIND_TONE[kind],
        href: item.url_path,
        caption: item.predicted ? `${tc(`sources.${item.source}`)} · ${t("predicted")}` : tc(`sources.${item.source}`),
        predicted: item.predicted,
        short: kind === "other" ? undefined : t(`short.${kind}`),
      })
    }
    return toBlocks(entries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.data, scores.data, catalog.data, calendar.data, list.data, locale])

  const universities = useMemo(
    () =>
      (list.data ?? []).map((entry) => ({
        id: uniGroup(entry.id),
        entry: entry.id,
        name: entry.institution.name,
        institution: entry.institution,
      })),
    [list.data],
  )
  const taskById = useMemo(() => new Map((tasks.data?.items ?? []).map((task) => [task.id, task])), [tasks.data])
  const view = useMemo(() => {
    const byRow = new Map<string, Block[]>()
    for (const block of blocks) byRow.set(block.rowId, [...(byRow.get(block.rowId) ?? []), block])
    const first = (list: Block[]) => Math.min(...list.map((block) => block.start))
    const lists = [...byRow.values()]
    const heads = new Map<string, Block[]>()
    for (const list of lists) {
      if (list[0]!.rowId.endsWith(HEADER_SUFFIX)) heads.set(list[0]!.group, list)
    }
    // Universities with nothing dated and no tasks fold into one line at the bottom.
    const used = new Set(lists.map((list) => list[0]!.group))
    const active = universities.filter((uni) => used.has(uni.id))
    const order = [...active.map((uni) => uni.id), GENERAL, MINE, NONE]
    const rows = lists
      .filter((list) => !list[0]!.rowId.endsWith(HEADER_SUFFIX))
      .sort((a, b) => order.indexOf(a[0]!.group) - order.indexOf(b[0]!.group) || first(a) - first(b))
      .map((list) => ({ list, first: list[0]! }))
    return {
      rows,
      heads,
      active,
      idle: universities.filter((uni) => !used.has(uni.id)),
      order,
      blocks: new Map(blocks.map((block) => [block.id, block])),
      ...chartRange(blocks, today),
    }
  }, [blocks, universities, today])
  const order = view.order
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
    const task = first.taskId ? taskById.get(first.taskId) : undefined
    const flag = block.shape === "flag"
    const behind = block.end < today
    return {
      id: block.id,
      start: block.start,
      end: block.end,
      tone: flag && behind ? "muted" : block.tone,
      shape: block.shape,
      label: first.title,
      short: flag ? first.short : undefined,
      count: block.entries.length,
      past: behind && (flag || task?.status === "done"),
      editable: Boolean(task?.deadline),
      ariaLabel: many
        ? t("dayCount", { count: block.entries.length, date: day(block.start) })
        : `${first.title}, ${range1(block)}`,
      tooltip: (
        <>
          <span className="text-[11px] opacity-80">{range1(block)}</span>
          {many ? (
            <span className="font-medium">
              {t("dayCount", { count: block.entries.length, date: day(block.start) })}
            </span>
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
  // A heading row stands for every group without task rows, so its (+) and deadline flags stay reachable.
  const withRows = new Set(rows.map((row) => row.group))
  const headings: GanttRow[] = [
    ...view.active.filter((uni) => !withRows.has(uni.id)).map((uni) => uni.id),
    ...(withRows.has(MINE) ? [] : [MINE]),
    ...(view.idle.length > 0 ? [NONE] : []),
  ].map((group) => ({ id: `${group}:heading`, label: "", group, items: [] }))
  const allRows: GanttRow[] = [...headings, ...rows].sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
  const groups: Record<string, string> = {
    [GENERAL]: t("general"),
    [MINE]: t("mine"),
    [NONE]: t("undated"),
    ...Object.fromEntries(view.active.map((uni) => [uni.id, uni.name])),
  }
  const groupItems: Record<string, GanttItem[]> = Object.fromEntries(
    view.active.map((uni) => [uni.id, (view.heads.get(uni.id) ?? []).map(item)]),
  )
  const groupIcons: Record<string, ReactNode> = Object.fromEntries(
    view.active.map((uni) => [
      uni.id,
      <LogoAvatar key={uni.id} name={uni.name} src={uni.institution.logo_url} className="size-5 shrink-0 ring-0" />,
    ]),
  )
  const focusGroup = !focusEntry
    ? null
    : view.active.some((uni) => uni.entry === focusEntry)
      ? uniGroup(focusEntry)
      : view.idle.some((uni) => uni.entry === focusEntry)
        ? NONE
        : null
  // Before the panel is measured (and where nothing can be measured) the window width stands in for it.
  const panel = boxWidth || (typeof window === "undefined" ? 1024 : window.innerWidth)
  const sidebar = panel < 640 ? 104 : 168
  const dayWidth = zoom === "fit" ? fitWidth(panel, sidebar, view.start, view.end) : ZOOM[zoom]
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
  const uniPrefill = (uni: (typeof universities)[number]): TaskPrefill => ({
    list_entry_id: uni.entry,
    deadline: nearestDeadline(uni.entry),
    links: [{ kind: "internal", label: uni.name, url: institutionUrl(uni.institution.id) }],
  })
  const groupActions: Record<string, ReactNode> = {
    [MINE]: addTo(t("mine"), {}),
    [GENERAL]: addTo(t("general"), {}),
    [NONE]: view.idle.map((uni) => (
      <span key={uni.id} className="inline-flex items-center normal-case">
        <span className="text-foreground font-medium">{uni.name}</span>
        {addTo(uni.name, uniPrefill(uni))}
      </span>
    )),
    ...Object.fromEntries(view.active.map((uni) => [uni.id, addTo(uni.name, uniPrefill(uni))])),
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
  function change(id: string, next: GanttRange) {
    const task = taskById.get(view.blocks.get(id)?.entries[0]?.taskId ?? "")
    if (!task) return
    move.mutate(
      {
        id: task.id,
        lock_version: task.lock_version,
        deadline: utcDayToIso(next.end),
        ...(task.start_date || next.start < next.end ? { start_date: utcDayToIso(next.start) } : {}),
      },
      { onError: (error) => showProblemToast(errorMessage(error)) },
    )
  }
  const open = selected ? view.blocks.get(selected) : undefined

  if (tasks.isPending || scores.isPending || list.isPending) return <Skeleton className="h-[60dvh] w-full" />
  if (tasks.isError) return <StateView state="error" error={tasks.error} onRetry={() => void tasks.refetch()} />

  return (
    <div ref={setBox} className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          value={[zoom]}
          onValueChange={(value) => value[0] && setZoom(value[0] as Zoom)}
          aria-label={t("zoom")}
          variant="outline"
        >
          {ZOOMS.map((key) => (
            <ToggleGroupItem key={key} value={key} className="min-h-11 px-3 md:min-h-8">
              {t(`zoomLevel.${key}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          variant="outline"
          onClick={() => setSettings(true)}
          className="min-h-11 md:min-h-8"
          aria-label={t("reminders")}
        >
          <Icons.notification aria-hidden />
          <span className="max-sm:hidden">{t("reminders")}</span>
        </Button>
      </div>
      {blocks.length === 0 && universities.length === 0 ? (
        <StateView state="empty" title={t("empty")} />
      ) : (
        <TooltipProvider delay={120}>
          <Gantt
            key={zoom}
            className="max-h-[calc(100dvh-13rem)] min-h-[280px]"
            rows={allRows}
            groups={groups}
            groupActions={groupActions}
            groupItems={groupItems}
            groupIcons={groupIcons}
            scrollToGroup={focusGroup}
            start={view.start}
            end={view.end}
            today={today}
            dayWidth={dayWidth}
            sidebarWidth={sidebar}
            todayLabel={t("today")}
            ariaLabel={t("label")}
            monthLabel={(time) =>
              fmt(time, { month: "long", year: "numeric" }).replace(/^\p{L}/u, (c) => c.toLocaleUpperCase(locale))
            }
            dayLabel={day}
            weekdayLabel={(time) => fmt(time, { weekday: "short" })}
            onSelect={select}
            onChange={change}
          />
        </TooltipProvider>
      )}
      <ResponsiveDialog
        open={Boolean(open)}
        onOpenChange={(next) => !next && setSelected(null)}
        title={
          open
            ? open.entries.length > 1
              ? t("dayCount", { count: open.entries.length, date: day(open.start) })
              : open.entries[0]!.title
            : ""
        }
      >
        {open ? (
          <ul className="flex flex-col gap-3">
            {open.entries.map((entry) => (
              <li key={entry.id} className="flex min-w-0 flex-col gap-1 rounded-lg border p-3 text-sm">
                {open.entries.length > 1 ? <span className="font-medium break-words">{entry.title}</span> : null}
                <span className="text-muted-foreground text-xs">
                  {kindLabel(entry)} ·{" "}
                  {entry.start === entry.end ? day(entry.start) : `${day(entry.start)} – ${day(entry.end)}`}
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {entry.href ? (
                    <Link
                      href={entry.href}
                      className="text-primary min-h-11 content-center text-sm font-medium hover:underline md:min-h-0"
                    >
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
                        title:
                          entry.kind === "registration" ? `${entry.title}: ${t("registrationCloses")}` : entry.title,
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
