"use client"

import { useFormatters, useLocale, useNow, useT } from "@ihsp/i18n"
import type { Task } from "../api"

const DAY = 86_400_000
const MONTHLY_FROM_DAYS = 100

function ms(value: string): number {
  return new Date(`${value}T00:00:00Z`).getTime()
}

type Tick = { at: number; label: string }

/** Month starts (long ranges) or Mondays (short ranges) inside [from, to]. */
function buildTicks(from: number, to: number, locale: string): Tick[] {
  const monthly = (to - from) / DAY > MONTHLY_FROM_DAYS
  const format = new Intl.DateTimeFormat(
    locale,
    monthly
      ? { month: "short", year: "2-digit", timeZone: "UTC" }
      : { day: "numeric", month: "short", timeZone: "UTC" },
  )
  const ticks: Tick[] = []
  if (monthly) {
    const start = new Date(from)
    let at = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + (start.getUTCDate() > 1 ? 1 : 0), 1)
    while (at <= to) {
      ticks.push({ at, label: format.format(at) })
      const next = new Date(at)
      at = Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 1)
    }
  } else {
    const weekday = new Date(from).getUTCDay()
    let at = from + ((8 - weekday) % 7) * DAY
    while (at <= to) {
      ticks.push({ at, label: format.format(at) })
      at += 7 * DAY
    }
  }
  return ticks
}

/** Gantt-like bars from each task's start to its deadline on a shared date axis with a today marker. */
export function TaskTimeline({ tasks, onOpen }: { tasks: Task[]; onOpen: (task: Task) => void }) {
  const t = useT("tasks")
  const locale = useLocale()
  const { date } = useFormatters()
  const now = useNow({ updateInterval: 60_000 })
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const dated = tasks
    .filter((task) => task.deadline)
    .map((task) => {
      const end = ms(task.deadline as string)
      const begin = task.start_date ? Math.min(ms(task.start_date), end) : end
      return { task, begin, end }
    })
  const undated = tasks.filter((task) => !task.deadline)
  const lo = Math.min(today, ...dated.map((row) => row.begin))
  const hi = Math.max(today, ...dated.map((row) => row.end))
  const pad = Math.max(Math.round((hi - lo) * 0.04), DAY)
  const min = lo - pad
  const span = hi + pad - min
  const pct = (time: number) => ((time - min) / span) * 100
  const ticks = buildTicks(min, min + span, locale)
  return (
    <div className="flex flex-col gap-4">
      {dated.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="relative flex min-w-[40rem] flex-col gap-3 pb-6">
            <div className="text-muted-foreground relative h-5 text-xs" aria-hidden>
              {ticks.map((tick) => (
                <span
                  key={tick.at}
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${pct(tick.at)}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-5 bottom-0" aria-hidden>
              {ticks.map((tick) => (
                <span
                  key={tick.at}
                  className="bg-border absolute inset-y-0 w-px"
                  style={{ left: `${pct(tick.at)}%` }}
                />
              ))}
              <span className="bg-destructive absolute inset-y-0 w-0.5" style={{ left: `${pct(today)}%` }}>
                <span className="bg-destructive text-destructive-foreground absolute top-full left-1/2 mt-0.5 -translate-x-1/2 rounded px-1 text-xs whitespace-nowrap">
                  {t("timeline.today")}
                </span>
              </span>
            </div>
            {dated.map(({ task, begin, end }) => {
              const from = date(new Date(begin).toISOString().slice(0, 10))
              const to = date(task.deadline as string)
              return (
                <div key={task.id} className="relative flex flex-col gap-1">
                  <span className="text-xs font-medium">{task.title}</span>
                  <div className="bg-muted/50 relative h-6 rounded-md">
                    <button
                      type="button"
                      aria-label={t("timeline.bar", { title: task.title, from, to })}
                      onClick={() => onOpen(task)}
                      className={`absolute top-0 h-6 min-w-2 rounded-md ${task.overdue ? "bg-destructive" : task.status === "done" ? "bg-success" : "bg-primary"}`}
                      style={{ left: `${pct(begin)}%`, width: `${Math.max(((end + DAY - begin) / span) * 100, 0.8)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground text-xs">{`${from} – ${to}`}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
      {undated.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-muted-foreground text-xs font-medium">{t("timeline.noDates")}</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {undated.map((task) => (
              <li key={task.id}>
                <button type="button" className="min-h-8 hover:underline" onClick={() => onOpen(task)}>
                  {task.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
