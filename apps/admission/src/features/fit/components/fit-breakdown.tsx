"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { knownShare, METRIC_STYLE, type MetricId, type MetricResult, type UniFit } from "../fit-model"

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

function MetricRow({ metric, full, onHover }: { metric: MetricResult; full: boolean; onHover?: (id: MetricId | null) => void }) {
  const t = useT("fit")
  const missing = metric.score === null
  return (
    <li className="flex items-start gap-3" onMouseEnter={() => onHover?.(metric.id)} onMouseLeave={() => onHover?.(null)}>
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
                <span className="ms-1.5 opacity-70">· {t("weight", { pct: Math.round(metric.weight * 100) })}</span>
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
          {missing ? null : <div className="h-full rounded-full" style={{ width: `${metric.score}%`, background: METRIC_STYLE[metric.id].color }} />}
        </div>
        {metric.why.slice(0, full ? 3 : 1).map((line) => (
          <p key={line} className="text-muted-foreground text-xs leading-snug">
            {line}
          </p>
        ))}
      </div>
    </li>
  )
}

/**
 * The per-segment explanation. `compact` (desktop hover) shows one "why" line per metric; `full` (the sheet) shows
 * all of them, the steps that raise each metric and the link to the weights.
 */
export function FitBreakdown({
  name,
  fit,
  full,
  onHover,
}: {
  name: string
  fit: UniFit
  full?: boolean
  onHover?: (id: MetricId | null) => void
}) {
  const t = useT("fit")
  const known = knownShare(fit)
  const raises = fit.metrics.flatMap((metric) => metric.raise.map((raise) => ({ ...raise, metric: metric.id })))
  raises.sort((a, b) => b.gain - a.gain)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground text-2xl font-semibold tabular-nums">{fit.total ?? "—"}</span>
          {fit.total === null ? "" : "/100"}
        </p>
      </div>
      {fit.total === null ? (
        <p className="text-muted-foreground -mt-2 text-xs">{t("none")}</p>
      ) : known < 0.999 ? (
        <p className="text-muted-foreground -mt-2 text-xs">{t("known", { pct: Math.round(known * 100) })}</p>
      ) : null}
      <ul className="flex flex-col gap-3.5">
        {fit.metrics.map((metric) => (
          <MetricRow key={metric.id} metric={metric} full={!!full} onHover={onHover} />
        ))}
      </ul>
      {full && raises.length > 0 ? (
        <section className="flex flex-col gap-2 border-t pt-3">
          <h3 className="text-sm font-semibold">{t("moves.title")}</h3>
          <ul className="flex flex-col gap-1.5">
            {raises.slice(0, 4).map((raise) => (
              <li key={`${raise.metric}-${raise.href}-${raise.label}`}>
                <Link
                  href={raise.href}
                  className="hover:bg-muted/60 focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                >
                  <MetricIcon id={raise.metric} className="size-6" />
                  <span className="min-w-0 flex-1">{raise.label}</span>
                  <span className="bg-success/15 text-success rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">+{raise.gain}</span>
                  <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {full ? (
        <div className="flex flex-col gap-2 border-t pt-3">
          <Link href="/profile/professions/" className="text-primary inline-flex min-h-9 items-center gap-1.5 text-sm font-medium hover:underline">
            <Icons.arrowRight aria-hidden className="size-4" />
            {t("raiseGoals")}
          </Link>
          <Link href="/profile/#weights" className="text-primary inline-flex min-h-9 items-center gap-1.5 text-sm font-medium hover:underline">
            <Icons.settings aria-hidden className="size-4" />
            {t("changeWeights")}
          </Link>
          <p className="text-muted-foreground text-xs">{t("disclaimer")}</p>
        </div>
      ) : null}
    </div>
  )
}
