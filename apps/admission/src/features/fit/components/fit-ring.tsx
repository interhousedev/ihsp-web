import { cn } from "@ihsp/ui"
import type { ReactNode } from "react"
import "../fit.css"
import { METRIC_STYLE, normalise, type MetricId, type MetricResult } from "../fit-model"

const RADIUS = 44
const STROKE = 9
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP_DEG = 8

function arcPath(startDeg: number, sweepDeg: number) {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return `${(50 + RADIUS * Math.cos(rad)).toFixed(2)} ${(50 + RADIUS * Math.sin(rad)).toFixed(2)}`
  }
  return `M ${point(startDeg)} A ${RADIUS} ${RADIUS} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${point(startDeg + sweepDeg)}`
}

/**
 * A segmented donut. Each metric owns a slot as wide as its weight; the coloured part of the slot is the sub-score,
 * so the filled arc is `sub-score × weight` and the whole coloured ring is the total. Missing data is a tinted
 * track with a dashed overlay in the axis colour ("fill me"), never grey. The centre holds `children` (the university logo). Presentation only.
 */
export function FitRing({
  metrics,
  size = 52,
  active,
  children,
  className,
}: {
  metrics: MetricResult[]
  size?: number
  /** A metric to emphasise (hovered row in a breakdown). */
  active?: MetricId | null
  children?: ReactNode
  className?: string
}) {
  const w = normalise(Object.fromEntries(metrics.map((metric) => [metric.id, metric.weight])) as Record<MetricId, number>)
  let cursor = -90
  const arcs = metrics.map((metric) => {
    const sweep = w[metric.id] * 360
    const start = cursor + GAP_DEG / 2
    cursor += sweep
    const slot = Math.max(((sweep - GAP_DEG) / 360) * CIRCUMFERENCE, 0)
    return { metric, start, sweep: sweep - GAP_DEG, slot, fill: slot * ((metric.score ?? 0) / 100) }
  })
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {arcs.map(({ metric, start, sweep, slot, fill }) => {
          const dim = active && active !== metric.id
          const common = { cx: 50, cy: 50, r: RADIUS, fill: "none", transform: `rotate(${start} 50 50)` }
          return (
            <g key={metric.id} className={cn("transition-opacity duration-200", dim && "opacity-35")}>
              {metric.score === null ? (
                <>
                  <circle {...common} strokeWidth={STROKE} strokeDasharray={`${slot} ${CIRCUMFERENCE}`} stroke={METRIC_STYLE[metric.id].color} opacity={0.2} />
                  <path
                    d={arcPath(start, sweep)}
                    fill="none"
                    strokeWidth={STROKE * 0.4}
                    strokeDasharray="3.5 4.5"
                    stroke={METRIC_STYLE[metric.id].color}
                  />
                </>
              ) : (
                <>
                  <circle {...common} strokeWidth={STROKE} strokeDasharray={`${slot} ${CIRCUMFERENCE}`} stroke={METRIC_STYLE[metric.id].color} opacity={0.2} />
                  <circle {...common} strokeWidth={STROKE} strokeDasharray={`${fill} ${CIRCUMFERENCE}`} stroke={METRIC_STYLE[metric.id].color} />
                </>
              )}
            </g>
          )
        })}
      </svg>
      <span className="relative flex items-center justify-center" style={{ width: size * 0.76, height: size * 0.76 }}>
        {children}
      </span>
    </span>
  )
}
