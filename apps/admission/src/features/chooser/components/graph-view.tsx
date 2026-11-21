"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn, Icons, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { FitRingButton } from "../../fit/components/fit-ring-button"
import { MetricIcon } from "../../fit/components/fit-breakdown"
import { RingLogo } from "../../fit/components/ring-logo"
import type { MetricResult } from "../../fit/fit-model"
import { useListRows, type ListRow } from "../use-list-rows"
import { formatCompactCurrency } from "./money"
import { useOptionLabel } from "./option-label"

export type ListView = "table" | "graph"

/** The Table | Graph switch of the list stage; the page owns the value. */
export function ViewToggle({ value, onChange }: { value: ListView; onChange: (next: ListView) => void }) {
  const t = useT("uniList")
  const items = [
    { id: "table", icon: Icons.journal, label: t("graph.table") },
    { id: "graph", icon: Icons.reports, label: t("graph.graph") },
  ] as const
  return (
    <div role="radiogroup" aria-label={t("graph.viewLabel")} className="bg-muted inline-flex rounded-full p-1">
      {items.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "focus-visible:ring-ring flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium outline-none focus-visible:ring-2",
            value === id ? "bg-background shadow-xs" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon aria-hidden className="size-4" />
          {label}
        </button>
      ))}
    </div>
  )
}

type Point = { row: ListRow; chance: number; cost: number }

/** A round axis maximum above `value`: 1, 2, 2.5, 5 or 10 times a power of ten. */
function niceMax(value: number): number {
  const power = 10 ** Math.floor(Math.log10(Math.max(value, 1)))
  const step = [1, 2, 5, 10].find((candidate) => candidate * power >= value) ?? 10
  return step * power
}

const PLOT = { top: 30, right: 22, bottom: 52, left: 56 }
const TICKS = [0, 0.25, 0.5, 0.75, 1]

function Scatter({ points, budget, max }: { points: Point[]; budget: number | null; max: number }) {
  const t = useT("uniList")
  const locale = useLocale()
  const usd = (value: number) => formatCompactCurrency(value, "USD", locale)
  return (
    <div
      role="group"
      aria-label={t("graph.chartLabel")}
      className="relative h-[21rem] w-full md:h-[27rem]"
      data-testid="uni-scatter"
    >
      <div className="absolute" style={{ inset: `${PLOT.top}px ${PLOT.right}px ${PLOT.bottom}px ${PLOT.left}px` }}>
        {budget !== null ? (
          <div
            aria-hidden
            className="bg-destructive/5 absolute inset-x-0 top-0 rounded-t-lg"
            style={{ height: `${Math.max(0, 100 - (budget / max) * 100)}%` }}
          />
        ) : null}
        {TICKS.map((tick) => (
          <div
            key={`y${tick}`}
            aria-hidden
            className="border-border absolute inset-x-0 border-t"
            style={{ bottom: `${tick * 100}%` }}
          >
            <span className="text-muted-foreground absolute -start-1 -translate-x-full -translate-y-1/2 text-xs tabular-nums">
              {usd(tick * max)}
            </span>
          </div>
        ))}
        {TICKS.map((tick) => (
          <div
            key={`x${tick}`}
            aria-hidden
            className="border-border absolute inset-y-0 border-s"
            style={{ left: `${tick * 100}%` }}
          >
            <span className="text-muted-foreground absolute top-full pt-2 text-xs -translate-x-1/2 tabular-nums">
              {Math.round(tick * 100)}%
            </span>
          </div>
        ))}
        {budget !== null ? (
          <div
            aria-hidden
            className="border-destructive absolute inset-x-0 border-t-2 border-dashed"
            style={{ bottom: `${(budget / max) * 100}%` }}
          >
            <span className="bg-background text-destructive absolute end-0 bottom-1 rounded-full border px-2 py-0.5 text-xs font-medium">
              {t("graph.budgetLine", { value: usd(budget) })}
            </span>
          </div>
        ) : null}
        {points.map(({ row, chance, cost }) => {
          const name = row.entry.institution.name
          return (
            <div
              key={row.entry.id}
              className="absolute -translate-x-1/2 translate-y-1/2 hover:z-10"
              style={{ left: `${Math.min(100, Math.max(0, chance))}%`, bottom: `${(cost / max) * 100}%` }}
            >
              <FitRingButton name={name} fit={row.fit} size={40}>
                <RingLogo name={name} src={row.entry.institution.logo_url} />
              </FitRingButton>
            </div>
          )
        })}
      </div>
      <span className="text-muted-foreground absolute start-0 top-0 text-xs">{t("graph.yAxis")}</span>
      <span className="text-muted-foreground absolute inset-x-0 bottom-0 text-center text-xs">{t("graph.xAxis")}</span>
    </div>
  )
}

const TONE = { reach: "bg-warning", target: "bg-primary", safety: "bg-success", home: "bg-success/60" } as const

/** Reach / target / safety (and safe-at-home) as one bar with the counts. */
function BalanceBar({ rows }: { rows: ListRow[] }) {
  const t = useT("uniList")
  const role = useOptionLabel("bucket")
  const segments = (["reach", "target", "safety", "home"] as const)
    .map((key) => ({
      key,
      value: rows.filter((row) => row.label === key).length,
      label: key === "home" ? t("graph.home") : role(key),
    }))
    .filter((segment) => segment.value > 0)
  const unlabelled = rows.filter((row) => row.label === null).length
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  return (
    <section aria-label={t("graph.balance")} className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{t("graph.balance")}</h3>
      <div
        role="img"
        aria-label={segments.map((segment) => `${segment.label}: ${segment.value}`).join(", ")}
        className="flex h-3 gap-1"
      >
        {total === 0 ? <span className="bg-muted flex-1 rounded-full" /> : null}
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={cn("min-w-3 rounded-full", TONE[segment.key])}
            style={{ flex: segment.value }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5 rounded-full", TONE[segment.key])} />
            <span className="font-semibold tabular-nums">{segment.value}</span>
            <span className="text-muted-foreground">{segment.label}</span>
          </li>
        ))}
        {unlabelled > 0 ? (
          <li className="text-muted-foreground flex items-center gap-1.5">
            <span className="font-semibold tabular-nums">{unlabelled}</span>
            {t("graph.unlabelled")}
          </li>
        ) : null}
      </ul>
    </section>
  )
}

/** The strongest known axes of the fit, each with its first "why" line: the reasons this university was matched. */
function whyTags(metrics: MetricResult[]): MetricResult[] {
  return metrics
    .filter((metric) => metric.score !== null && metric.score >= 50 && metric.why.length > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
}

function WhyCard({ row }: { row: ListRow }) {
  const t = useT("uniList")
  const tFit = useT("fit")
  const locale = useLocale()
  const role = useOptionLabel("bucket")
  const { institution } = row.entry
  const tags = whyTags(row.fit.metrics)
  const label = row.label === null ? null : row.label === "home" ? t("graph.home") : role(row.label)
  return (
    <li className="bg-card flex flex-col gap-3 rounded-card border p-4">
      <div className="flex items-center gap-3">
        <FitRingButton name={institution.name} fit={row.fit} size={44}>
          <RingLogo name={institution.name} src={institution.logo_url} />
        </FitRingButton>
        <div className="min-w-0 flex-1">
          <Link
            href={`/chooser/institution/?id=${encodeURIComponent(institution.id)}`}
            className="hover:text-primary block truncate text-sm font-semibold"
          >
            {institution.name}
          </Link>
          <p className="text-muted-foreground truncate text-xs tabular-nums">
            {[
              label,
              row.chance === null ? null : t("graph.chance", { value: Math.round(row.chance) }),
              row.cost
                ? `${row.cost.kind === "net" ? "≈ " : ""}${formatCompactCurrency(row.cost.amount, row.cost.currency, locale)}${row.cost.kind === "sticker" ? ` ${t("graph.sticker")}` : ""}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      {tags.length > 0 ? (
        <ul aria-label={t("graph.why")} className="flex flex-wrap gap-1.5">
          {tags.map((metric) => (
            <li
              key={metric.id}
              className="bg-muted/60 flex max-w-full items-start gap-1.5 rounded-2xl py-1 ps-1 pe-2.5 text-xs leading-snug"
            >
              <MetricIcon id={metric.id} className="size-5" />
              <span className="min-w-0 self-center">
                <span className="sr-only">{tFit(`metric.${metric.id}.name`)}: </span>
                {metric.why[0]}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">{t("graph.noWhy")}</p>
      )}
    </li>
  )
}

/**
 * The graph view of the list: a scatter of my universities (admission chance across, yearly cost after aid up) with
 * the family budget as a horizontal line, the reach / target / safety balance, and why each one was matched.
 * Owns its data (the same joined rows as the table), so the list stage only mounts it.
 */
export function GraphView() {
  const t = useT("uniList")
  const { rows, familyBudget, isPending } = useListRows()
  if (isPending) return <Skeleton className="h-96 w-full rounded-3xl" />
  const points = rows.flatMap((row): Point[] =>
    row.chance !== null && row.cost?.currency === "USD" ? [{ row, chance: row.chance, cost: row.cost.amount }] : [],
  )
  const hidden = rows.length - points.length
  const max = niceMax(Math.max(familyBudget ?? 0, ...points.map((point) => point.cost)) * 1.1)
  return (
    <div className="flex flex-col gap-6" data-testid="uni-graph">
      <section className="bg-card flex flex-col gap-3 rounded-3xl border p-4 md:p-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{t("graph.title")}</h2>
          <p className="text-muted-foreground text-sm">{t("graph.hint")}</p>
        </header>
        {points.length > 0 ? (
          <Scatter points={points} budget={familyBudget} max={max} />
        ) : (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("graph.empty")}</p>
        )}
        {familyBudget === null ? <p className="text-muted-foreground text-xs">{t("graph.noBudget")}</p> : null}
        {hidden > 0 && points.length > 0 ? (
          <p className="text-muted-foreground text-xs">{t("graph.hidden", { count: hidden })}</p>
        ) : null}
      </section>
      <BalanceBar rows={rows} />
      <section aria-label={t("graph.whyTitle")} className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{t("graph.whyTitle")}</h3>
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <WhyCard key={row.entry.id} row={row} />
          ))}
        </ul>
      </section>
    </div>
  )
}
