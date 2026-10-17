"use client"

import {
  getCertificateStatsQuery,
  type CertificateFilters,
  type CertificateStatsType,
  type CertificateType,
} from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle, StateView } from "@ihsp/ui"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@ihsp/ui/chart"
import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { typeName } from "./utils"

/** Evenly spread hues, readable in both themes. */
export function levelColor(index: number, total: number): string {
  return `hsl(${Math.round((index * 360) / Math.max(total, 1))} 62% 52%)`
}

/** Chart rows (one per group) and the series config of one type; exported for the tests. */
export function chartModel(stat: CertificateStatsType) {
  const config: ChartConfig = {}
  stat.levels.forEach((level, index) => {
    config[`l${index}`] = { label: level, color: levelColor(index, stat.levels.length) }
  })
  const rows = stat.groups.map((group) => {
    const row: Record<string, string | number> = { group: group.group_name }
    stat.levels.forEach((level, index) => {
      row[`l${index}`] = group.counts[level] ?? 0
    })
    return row
  })
  return { config, rows }
}

function TypeChart({ stat, title }: { stat: CertificateStatsType; title: string }) {
  const t = useT("certificates.stats")
  const { config, rows } = chartModel(stat)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full" aria-label={`${title}: ${t("count")}`}>
          <BarChart data={rows}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="group" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {stat.levels.map((level, index) => (
              <Bar key={level} dataKey={`l${index}`} stackId="levels" fill={`var(--color-l${index})`} />
            ))}
          </BarChart>
        </ChartContainer>
        <ul className="sr-only">
          {stat.groups.map((group) => (
            <li key={group.group_id}>
              {group.group_name}:{" "}
              {Object.entries(group.counts)
                .map(([level, count]) => `${level} ${count}`)
                .join(", ")}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/** Stacked bars per certificate type: the count by level in each group. */
export function CertificateStats({ filters, types }: { filters: CertificateFilters; types: CertificateType[] }) {
  const t = useT("certificates.stats")
  const locale = useLocale()
  const query = useQuery(getCertificateStatsQuery(filters))
  if (query.isPending) return <StateView state="loading" rows={2} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  const stats = query.data.types.filter((stat) => stat.groups.length > 0)
  if (stats.length === 0) return <StateView state="empty" emptyText={t("empty")} />
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {stats.map((stat) => (
        <TypeChart
          key={stat.type_id}
          stat={stat}
          title={
            typeName(
              types.find((type) => type.id === stat.type_id),
              locale,
            ) || stat.type_id
          }
        />
      ))}
    </div>
  )
}
