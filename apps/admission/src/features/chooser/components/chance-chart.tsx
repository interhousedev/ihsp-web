"use client"

import { useT } from "@ihsp/i18n"
import { Slider } from "@ihsp/ui"
import { useState } from "react"
import type { AdmissionChanceSimulation as ChanceSimulation } from "@ihsp/api"

const W = 320
const H = 140
const PAD = 12

const asPercent = (chance: number) => Math.round(chance)

/** The chance at `x`, interpolated between the two neighbouring simulation points. */
export function chanceAt(points: ChanceSimulation["points"], x: number): number {
  const sorted = [...points].sort((a, b) => a.x - b.x)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) return 0
  if (x <= first.x) return asPercent(first.chance)
  if (x >= last.x) return asPercent(last.chance)
  const hi = sorted.findIndex((point) => point.x >= x)
  const a = sorted[hi - 1]!
  const b = sorted[hi]!
  const ratio = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x)
  return Math.round(asPercent(a.chance) + (asPercent(b.chance) - asPercent(a.chance)) * ratio)
}

/** A line chart of the admission chance against GPA or score, with a slider that reads the chance off the line. */
export function ChanceChart({ simulation }: { simulation: ChanceSimulation }) {
  const t = useT("chooser")
  const { metric, your_value, median, threshold } = simulation
  const points: ChanceSimulation["points"] = simulation.points ?? []
  const yours = your_value ?? 0
  const xs = points.map((point) => point.x)
  const min = Math.min(...xs, yours)
  const max = Math.max(...xs, yours)
  const [value, setValue] = useState(yours)
  if (your_value == null || points.length < 2 || max === min) return null
  const sx = (x: number) => PAD + ((x - min) / (max - min)) * (W - 2 * PAD)
  const sy = (chance: number) => H - PAD - (asPercent(chance) / 100) * (H - 2 * PAD)
  const sorted = [...points].sort((a, b) => a.x - b.x)
  const path = sorted.map((point, index) => `${index ? "L" : "M"}${sx(point.x)} ${sy(point.chance)}`).join(" ")
  const step = (max - min) / 100
  const marks = [
    { key: "median", x: median },
    { key: "threshold", x: threshold },
  ].flatMap((mark) => (mark.x == null ? [] : [{ key: mark.key, x: mark.x }]))
  return (
    <section aria-label={t("chances.simulation.chart")} className="flex flex-col gap-3" data-testid="chance-chart">
      <h3 className="text-sm font-semibold">{t(`chances.simulation.title_${metric}`)}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("chances.simulation.chart")} className="w-full">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="stroke-border" />
        {marks.map((mark) => (
          <g key={mark.key}>
            <line
              x1={sx(mark.x)}
              y1={PAD}
              x2={sx(mark.x)}
              y2={H - PAD}
              className="stroke-muted-foreground"
              strokeDasharray="3 3"
            />
            <text x={sx(mark.x)} y={PAD - 2} textAnchor="middle" className="fill-muted-foreground text-[8px]">
              {t(`chances.simulation.${mark.key}`)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" className="stroke-primary" strokeWidth={2} />
        <circle cx={sx(value)} cy={sy(chanceAt(points, value))} r={4} className="fill-primary" />
      </svg>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        aria-label={t(`chances.simulation.title_${metric}`)}
        onValueChange={(next) => setValue(Array.isArray(next) ? (next[0] ?? yours) : next)}
      />
      <p className="text-sm" aria-live="polite">
        {t("chances.simulation.reading", { value: Math.round(value * 100) / 100, chance: chanceAt(points, value) })}
      </p>
    </section>
  )
}
