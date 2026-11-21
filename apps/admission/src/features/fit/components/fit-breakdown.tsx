"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { composite, METRIC_STYLE, normalise, type Line, type MetricId, type MetricResult, type UniFit } from "../fit-model"

/** Translates a line of `fit.<prefix>`; a placeholder value `@x.y` is replaced by the term `fit.terms.x.y`. */
export function useLineText() {
  const t = useT("fit")
  return (prefix: "why" | "moves", line: Line) =>
    t(
      `${prefix}.${line.key}`,
      Object.fromEntries(
        Object.entries(line.params ?? {}).map(([key, value]) => [
          key,
          typeof value === "string" && value.startsWith("@") ? t(`terms.${value.slice(1)}`) : value,
        ]),
      ),
    )
}

/** The icon tile of a metric in its token colour (the legend mark). */
export function MetricIcon({ id, className }: { id: MetricId; className?: string }) {
  const Icon = Icons[METRIC_STYLE[id].icon]
  return (
    <span
      className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-white", className)}
      style={{ background: METRIC_STYLE[id].color }}
    >
      <Icon aria-hidden className="size-4 text-white mix-blend-normal [filter:drop-shadow(0_0_1px_rgb(0_0_0/.35))]" />
    </span>
  )
}

function MetricRow({
  metric,
  weight,
  full,
  onHover,
}: {
  metric: MetricResult
  weight: number
  full: boolean
  onHover?: (id: MetricId | null) => void
}) {
  const t = useT("fit")
  const text = useLineText()
  const missing = metric.score === null
  return (
    <li
      className="flex items-start gap-3"
      onMouseEnter={() => onHover?.(metric.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <MetricIcon id={metric.id} className={cn(missing && "bg-muted! text-muted-foreground")} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="min-w-0 font-medium">{t(`metric.${metric.id}.name`)}</span>
          <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap tabular-nums">
            {missing ? (
              t("missing")
            ) : (
              <>
                {metric.score}
                <span className="ms-1.5 opacity-70">· {t("weight", { pct: Math.round(weight * 100) })}</span>
              </>
            )}
          </span>
        </div>
        <div
          className={cn("h-1.5 overflow-hidden rounded-full", missing ? "border border-dashed" : "bg-muted")}
          role="meter"
          aria-label={t(`metric.${metric.id}.name`)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={metric.score ?? undefined}
        >
          {missing ? null : (
            <div className="h-full rounded-full" style={{ width: `${metric.score}%`, background: METRIC_STYLE[metric.id].color }} />
          )}
        </div>
        {metric.why.slice(0, full ? 2 : 1).map((line) => (
          <p key={line.key} className="text-muted-foreground text-xs leading-snug">
            {text("why", line)}
          </p>
        ))}
      </div>
    </li>
  )
}

/**
 * The per-segment explanation. `compact` (desktop hover) shows one "why" line per metric; `full` (the sheet) shows
 * two and the "what moves it" actions.
 */
export function FitBreakdown({
  name,
  fit,
  weights,
  full,
  onHover,
}: {
  name: string
  fit: UniFit
  weights: Record<MetricId, number>
  full?: boolean
  onHover?: (id: MetricId | null) => void
}) {
  const t = useT("fit")
  const text = useLineText()
  const w = normalise(weights)
  const total = composite(fit.metrics, weights)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground text-2xl font-semibold tabular-nums">{total.value ?? "—"}</span>
          {total.value === null ? "" : "/100"}
        </p>
      </div>
      {total.known < 0.999 ? (
        <p className="text-muted-foreground -mt-2 text-xs">{t("known", { pct: Math.round(total.known * 100) })}</p>
      ) : null}
      <ul className="flex flex-col gap-3.5">
        {fit.metrics.map((metric) => (
          <MetricRow key={metric.id} metric={metric} weight={w[metric.id]} full={!!full} onHover={onHover} />
        ))}
      </ul>
      {full && fit.moves.length > 0 ? (
        <section className="flex flex-col gap-2 border-t pt-3">
          <h3 className="text-sm font-semibold">{t("moves.title")}</h3>
          <ul className="flex flex-col gap-1.5">
            {fit.moves.map((move) => (
              <li key={move.id}>
                <Link
                  href={move.href}
                  className="hover:bg-muted/60 focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                >
                  <MetricIcon id={move.metric} className="size-6" />
                  <span className="min-w-0 flex-1">
                    {text("moves", move.line)}
                    <span className="text-muted-foreground block text-xs">{t(`time.${move.time.unit}`, { n: move.time.n })}</span>
                  </span>
                  <span className="bg-success/15 text-success rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                    +{move.gain}
                  </span>
                  <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {full ? <p className="text-muted-foreground text-xs">{t("disclaimer")}</p> : null}
    </div>
  )
}
