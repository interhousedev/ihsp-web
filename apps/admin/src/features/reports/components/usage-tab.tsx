"use client"

import { getAdminInsightsQuery, type DayCount } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Stat,
  type ChartConfig,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { QueryState } from "../../shared/components/query-state"
import { formatBytes, formatCount } from "../utils"

function DayChart({
  title,
  label,
  data,
  kind,
}: {
  title: string
  label: string
  data: DayCount[]
  kind: "bar" | "area"
}) {
  const f = useFormatters()
  const config = { count: { label, color: "var(--chart-1)" } } satisfies ChartConfig
  const rows = data.map((day) => ({ day: f.date(day.date, { day: "numeric", month: "short" }), count: day.count }))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-48 w-full" role="img" aria-label={title}>
          {kind === "bar" ? (
            <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis width={32} tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={3} />
            </BarChart>
          ) : (
            <AreaChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis width={36} tickLine={false} axisLine={false} tickFormatter={formatCount} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                fill="var(--color-count)"
                fillOpacity={0.15}
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Sign-ins and assistant tokens per day (last 14 days) and the space the uploads take. */
export function UsageTab() {
  const t = useT("reports.usage")
  const query = useQuery(getAdminInsightsQuery())
  return (
    <QueryState query={query} rows={3}>
      {({ usage }) => (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label={t("storage")}
              value={formatBytes(usage.storage.bytes)}
              hint={t("files", { count: usage.storage.files })}
            />
            <Stat label={t("signInsToday")} value={usage.sign_ins.at(-1)?.count ?? 0} />
            <Stat label={t("tokensToday")} value={formatCount(usage.ai_tokens.at(-1)?.count ?? 0)} />
            <Stat
              label={t("tokensTotal")}
              value={formatCount(usage.ai_tokens.reduce((sum, day) => sum + day.count, 0))}
              hint={t("last14")}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <DayChart title={t("signIns")} label={t("users")} data={usage.sign_ins} kind="bar" />
            <DayChart title={t("tokens")} label={t("tokensLabel")} data={usage.ai_tokens} kind="area" />
          </div>
        </div>
      )}
    </QueryState>
  )
}
