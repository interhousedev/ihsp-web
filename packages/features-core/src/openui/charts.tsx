"use client"

import { Bar, BarChart as ReBarChart, CartesianGrid, Line, LineChart as ReLineChart, XAxis, YAxis } from "recharts"
import { useT } from "@ihsp/i18n"
import { ResponsiveContainer } from "recharts"
import { clamp, str } from "./safe"

type SeriesProps = {
  labels: string[]
  values: number[]
  title?: string
  unit?: string
  max: number
  kind: "bar" | "line"
}

function toData(labels: string[], values: number[], max: number) {
  const names = clamp(labels, max)
  return clamp(values, max)
    .slice(0, names.length)
    .map((value, index) => ({ name: str(names[index]), value: Number.isFinite(value) ? value : 0 }))
}

/** One-series chart sized to its container; colours come from the theme tokens. */
export function SeriesChart({ labels, values, title, unit, max, kind }: SeriesProps) {
  const t = useT("openui")
  const data = toData(labels, values, max)
  const axis = { stroke: "var(--muted-foreground)", fontSize: 12 }
  const chart =
    kind === "bar" ? (
      <ReBarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} {...axis} />
        <YAxis width={36} tickLine={false} axisLine={false} {...axis} />
        <Bar dataKey="value" fill="var(--chart-1)" radius={4} isAnimationActive={false} />
      </ReBarChart>
    ) : (
      <ReLineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} {...axis} />
        <YAxis width={36} tickLine={false} axisLine={false} {...axis} />
        <Line dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot isAnimationActive={false} />
      </ReLineChart>
    )
  return (
    <figure className="flex min-w-0 flex-col gap-1">
      {title ? (
        <figcaption className="text-sm font-medium">
          {str(title)}
          {unit ? <span className="text-muted-foreground font-normal"> ({str(unit)})</span> : null}
        </figcaption>
      ) : null}
      <div role="img" aria-label={title ? str(title) : t("chart")} className="h-48 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
