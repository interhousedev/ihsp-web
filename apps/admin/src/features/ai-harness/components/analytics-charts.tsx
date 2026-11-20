"use client"

import type { AiPromptSizePoint, AiRequestStatsRow, AiSpendDailyRow } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@ihsp/ui/chart"
import type { ReactNode } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { shortRequest } from "../utils"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

function ChartCard({
  title,
  empty,
  children,
  action,
}: {
  title: string
  empty: boolean
  children: ReactNode
  action?: ReactNode
}) {
  const t = useT("aiHarness.analytics")
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {empty ? <p className="text-muted-foreground py-10 text-center text-sm">{t("empty")}</p> : children}
      </CardContent>
    </Card>
  )
}

/**
 * Four charts in one module (one lazy chunk): prompt size per version, average answer length and tool calls per
 * request, and spend per day stacked by request.
 */
export default function AnalyticsCharts({
  sizes,
  requests,
  daily,
  slotPicker,
}: {
  sizes: AiPromptSizePoint[]
  requests: AiRequestStatsRow[]
  daily: AiSpendDailyRow[]
  slotPicker: ReactNode
}) {
  const t = useT("aiHarness.analytics")
  const f = useFormatters()
  const sizeData = [...sizes]
    .sort((a, b) => a.version - b.version)
    .map((point) => ({ version: point.version === 0 ? t("builtin") : `v${point.version}`, tokens: point.tokens_est }))
  const requestData = requests.map((row) => ({
    key: shortRequest(row.key),
    answer: Math.round(row.avg_answer_chars),
    tools: Number(row.avg_tool_calls.toFixed(1)),
  }))
  const ids = [...new Set(daily.map((row) => row.request_id))]
  const days = [...new Set(daily.map((row) => row.day))].sort()
  const spendConfig: ChartConfig = Object.fromEntries(
    ids.map((id, index) => [`s${index}`, { label: id, color: COLORS[index % COLORS.length] }]),
  )
  const spendData = days.map((day) => ({
    day: f.date(day, { day: "numeric", month: "short" }),
    ...Object.fromEntries(
      ids.map((id, index) => [
        `s${index}`,
        daily
          .filter((row) => row.day === day && row.request_id === id)
          .reduce((sum, row) => sum + row.cost_micro / 1_000_000, 0),
      ]),
    ),
  }))
  const single = (label: string, color: string): ChartConfig => ({ v: { label, color } })
  const vertical = { left: 4, right: 12, top: 4 }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title={t("charts.promptSize")} empty={sizeData.length === 0} action={slotPicker}>
        <ChartContainer
          config={single(t("charts.tokens"), COLORS[0])}
          className="h-56 w-full"
          role="img"
          aria-label={t("charts.promptSize")}
        >
          <BarChart data={sizeData} margin={vertical}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="version" tickLine={false} axisLine={false} />
            <YAxis width={48} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="tokens" name={t("charts.tokens")} fill={COLORS[0]} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
      <ChartCard title={t("charts.spend")} empty={spendData.length === 0}>
        <ChartContainer config={spendConfig} className="h-56 w-full" role="img" aria-label={t("charts.spend")}>
          <BarChart data={spendData} margin={vertical}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis width={56} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {ids.map((id, index) => (
              <Bar key={id} dataKey={`s${index}`} stackId="spend" fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        </ChartContainer>
      </ChartCard>
      <ChartCard title={t("charts.answerChars")} empty={requestData.length === 0}>
        <ChartContainer
          config={single(t("charts.answerChars"), COLORS[1])}
          className="h-56 w-full"
          role="img"
          aria-label={t("charts.answerChars")}
        >
          <BarChart data={requestData} layout="vertical" margin={vertical}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="key" width={120} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="answer" name={t("charts.answerChars")} fill={COLORS[1]} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
      <ChartCard title={t("charts.toolCalls")} empty={requestData.length === 0}>
        <ChartContainer
          config={single(t("charts.toolCalls"), COLORS[2])}
          className="h-56 w-full"
          role="img"
          aria-label={t("charts.toolCalls")}
        >
          <BarChart data={requestData} layout="vertical" margin={vertical}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="key" width={120} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="tools" name={t("charts.toolCalls")} fill={COLORS[2]} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}
