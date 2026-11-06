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

/** Rows of the distribution of a starred number: how many entries have each value, over all groups. */
export function distributionModel(stat: CertificateStatsType, countLabel: string) {
  const config: ChartConfig = { count: { label: countLabel, color: levelColor(0, 1) } }
  const rows = stat.levels.map((value) => ({
    value,
    count: stat.groups.reduce((sum, group) => sum + (group.counts[value] ?? 0), 0),
  }))
  return { config, rows }
}

/** An average for display, with the locale's decimal sign and no thousands grouping; "—" when none. */
export function formatAverage(value: number | null, locale: string): string {
  return value === null ? "—" : value.toLocaleString(locale, { maximumFractionDigits: 1, useGrouping: false })
}

/** The label of the starred field of a type, in the locale (its key when the type is unknown). */
export function groupingLabel(types: CertificateType[], stat: CertificateStatsType, locale: string): string {
  const field = types
    .find((type) => type.id === stat.type_id)
    ?.custom_fields.find((item) => item.key === stat.primary_key)
  const labels = (field?.label ?? {}) as Record<string, string | undefined>
  return field ? labels[locale] || field.label.en || field.key : (stat.primary_key ?? "")
}

function TypeChart({ stat, title, grouping }: { stat: CertificateStatsType; title: string; grouping?: string }) {
  const t = useT("certificates.stats")
  const { config, rows } = chartModel(stat)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {grouping ? <p className="text-muted-foreground text-sm">{t("groupedBy", { field: grouping })}</p> : null}
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

/** A starred number: the distribution of its values, the average overall and per group. */
function NumberStat({ stat, title, grouping }: { stat: CertificateStatsType; title: string; grouping: string }) {
  const t = useT("certificates.stats")
  const locale = useLocale()
  const { config, rows } = distributionModel(stat, t("count"))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("groupedBy", { field: grouping })}</p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-lg font-medium">{t("average", { value: formatAverage(stat.average, locale) })}</p>
        <ChartContainer
          config={config}
          className="aspect-auto h-48 w-full"
          aria-label={`${title}: ${t("distribution")}`}
        >
          <BarChart data={rows}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="value" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" />
          </BarChart>
        </ChartContainer>
        <ul className="grid gap-2">
          {stat.groups.map((group) => (
            <li key={group.group_id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{group.group_name}</span>
                <span>{t("average", { value: formatAverage(group.average, locale) })}</span>
              </div>
              <p className="text-muted-foreground">
                {Object.entries(group.counts)
                  .map(([value, count]) => `${value} × ${count}`)
                  .join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/** Stacked bars per certificate type: the count by level in each group, or by the starred field. */
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
      {stats.map((stat) => {
        const title =
          typeName(
            types.find((type) => type.id === stat.type_id),
            locale,
          ) || stat.type_id
        const grouping = stat.primary_key ? groupingLabel(types, stat, locale) : undefined
        return stat.primary_kind === "number" && grouping ? (
          <NumberStat key={stat.type_id} stat={stat} title={title} grouping={grouping} />
        ) : (
          <TypeChart key={stat.type_id} stat={stat} title={title} grouping={grouping} />
        )
      })}
    </div>
  )
}
