"use client"

import {
  getAiPromptSizesQuery,
  getAiRequestStatsQuery,
  getAiSpendDailyQuery,
  getAiSpendQuery,
  type AiRequestStatsResponse,
  type AiSpendResponse,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle, PageContainer, ResponsiveTable, Skeleton } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { lazy, Suspense, useState } from "react"
import { compact, rangeOf, todayIso } from "../../limits/utils"
import { SelectField } from "../../shared/components/select-field"
import { average, micro } from "../utils"
import { HarnessTabs } from "./harness-tabs"

/** The charts live in their own chunk: Recharts is large and the tables do not need it. */
const AnalyticsCharts = lazy(() => import("./analytics-charts"))

const RANGES = ["7", "30", "90"] as const

/** Analytics: prompt size per version, answer length and tool use per request, spend per day, request and user. */
export function AnalyticsPage() {
  const t = useT("aiHarness.analytics")
  const th = useT("aiHarness")
  const f = useFormatters()
  const [range, setRange] = useQueryState("range", parseAsStringLiteral(RANGES).withDefault("30"))
  const { from, to } = rangeOf(range, todayIso())
  const params = { start: from, end: to }
  const sizes = useQuery(getAiPromptSizesQuery())
  const stats = useQuery(getAiRequestStatsQuery({ ...params, group_by: "request" }))
  const daily = useQuery(getAiSpendDailyQuery(params))
  const users = useQuery(getAiSpendQuery({ ...params, by: "user", limit: 20 }))
  const rangeLabels = { "7": t("range.d7"), "30": t("range.d30"), "90": t("range.d90") }
  const slots = [...new Set((sizes.data?.items ?? []).map((point) => `${point.task}/${point.name}`))]
  const [slot, setSlot] = useState<string | null>(null)
  const chosen = slot ?? slots[0] ?? null
  return (
    <PageContainer title={th("title")}>
      <HarnessTabs />
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("range.label")}>
        {RANGES.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={range === value ? "default" : "outline"}
            aria-pressed={range === value}
            onClick={() => void setRange(value)}
          >
            {rangeLabels[value]}
          </Button>
        ))}
      </div>

      <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
        <AnalyticsCharts
          sizes={(sizes.data?.items ?? []).filter((point) => `${point.task}/${point.name}` === chosen)}
          requests={stats.data?.items ?? []}
          daily={daily.data?.items ?? []}
          slotPicker={
            slots.length > 1 ? (
              <SelectField
                aria-label={t("slot")}
                value={chosen}
                onChange={setSlot}
                options={slots.map((value) => ({ value, label: value }))}
                className="w-64"
              />
            ) : null
          }
        />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("requests.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState query={stats} rows={3} isEmpty={(data) => data.items.length === 0} emptyText={t("empty")}>
            {({ items }: AiRequestStatsResponse) => (
              <ResponsiveTable
                label={t("requests.title")}
                rows={items}
                rowKey={(row) => row.key}
                columns={[
                  {
                    id: "key",
                    header: t("requests.request"),
                    role: "title",
                    cell: (row) => <span className="font-mono text-xs">{row.key}</span>,
                  },
                  num("calls", t("requests.calls"), (row: StatRow) => compact(row.calls, f.locale)),
                  num("failed", t("requests.failed"), (row: StatRow) => compact(row.failed, f.locale)),
                  num("promptTokens", t("requests.promptTokens"), (row: StatRow) =>
                    average(row.avg_prompt_tokens, f.locale),
                  ),
                  num("answerChars", t("requests.answerChars"), (row: StatRow) =>
                    compact(Math.round(row.avg_answer_chars), f.locale),
                  ),
                  num("toolCalls", t("requests.toolCalls"), (row: StatRow) => average(row.avg_tool_calls, f.locale)),
                  num("cost", t("requests.cost"), (row: StatRow) => micro(row.cost_micro, f.locale)),
                ]}
              />
            )}
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("users.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState query={users} rows={3} isEmpty={(data) => data.items.length === 0} emptyText={t("empty")}>
            {({ items }: AiSpendResponse) => (
              <ResponsiveTable
                label={t("users.title")}
                rows={items}
                rowKey={(row) => row.key}
                columns={[
                  {
                    id: "user",
                    header: t("users.user"),
                    role: "title",
                    cell: (row) => row.user?.full_name ?? row.key,
                  },
                  { id: "role", header: t("users.role"), cell: (row) => row.user?.role ?? "" },
                  num("calls", t("users.calls"), (row: AiSpendResponse["items"][number]) =>
                    compact(row.calls, f.locale),
                  ),
                  num("cost", t("users.cost"), (row: AiSpendResponse["items"][number]) =>
                    micro(row.cost_micro, f.locale),
                  ),
                ]}
              />
            )}
          </QueryState>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

/** A right-aligned numeric column. */
function num<T>(id: string, header: string, cell: (row: T) => string) {
  return { id, header, headClassName: "text-end", cellClassName: "text-end tabular-nums", cell }
}

type StatRow = AiRequestStatsResponse["items"][number]
