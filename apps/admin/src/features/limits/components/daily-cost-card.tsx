"use client"

import type { UsageRow } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@ihsp/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { usd } from "../utils"

const FEATURE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

/**
 * Daily cost of the range, stacked by product feature. Its own module because Recharts is large: `limits-page.tsx`
 * loads it lazily, so the rest of the page (cards, lists, the editor) does not wait for the chart library.
 */
export default function DailyCostCard({ rows }: { rows: UsageRow[] }) {
  const t = useT("limits")
  const f = useFormatters()
  const features = [...new Set(rows.flatMap((row) => Object.keys(row.cost_by_feature)))]
  const config: ChartConfig = Object.fromEntries(
    features.map((name, index) => [
      name,
      { label: t.has(`features.${name}`) ? t(`features.${name}`) : name, color: FEATURE_COLORS[index % 5] },
    ]),
  )
  const data = rows.map((row) => ({
    day: f.date(row.key, { day: "numeric", month: "short" }),
    ...row.cost_by_feature,
  }))
  const total = rows.reduce((sum, row) => sum + row.cost_usd, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("charts.daily")}</CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <ChartContainer config={config} className="h-56 w-full" role="img" aria-label={t("charts.daily")}>
            <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis width={56} tickLine={false} axisLine={false} tickFormatter={(value) => usd(Number(value))} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {features.map((name) => (
                <Bar key={name} dataKey={name} stackId="cost" fill={`var(--color-${name})`} />
              ))}
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-muted-foreground py-10 text-center text-sm">{t("charts.empty")}</p>
        )}
      </CardContent>
    </Card>
  )
}
