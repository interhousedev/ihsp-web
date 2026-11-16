"use client"

import { getAdminPromptAnalyticsQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ResponsiveTable,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { addDays, compact, todayIso, usd } from "../../limits/utils"

/** Calls, tokens, cost and errors per prompt version of the last 30 days (version 0 is the built-in text). */
export function PromptAnalytics({ task }: { task?: string }) {
  const t = useT("prompts")
  const f = useFormatters()
  const today = todayIso()
  const query = useQuery(getAdminPromptAnalyticsQuery({ task, from: addDays(today, -29), to: today }))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("analytics.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState query={query} rows={3} isEmpty={(data) => data.items.length === 0} emptyText={t("analytics.empty")}>
          {({ items }) => (
            <ResponsiveTable
              label={t("analytics.title")}
              rows={items}
              rowKey={(row) => `${row.task}:${row.version}`}
              columns={[
                { id: "task", header: t("analytics.task"), role: "title", cell: (row) => row.task },
                {
                  id: "version",
                  header: t("analytics.version"),
                  cell: (row) => (row.version === 0 ? t("editor.builtin") : `v${row.version}`),
                },
                {
                  id: "calls",
                  header: t("analytics.calls"),
                  headClassName: "text-end",
                  cellClassName: "text-end tabular-nums",
                  cell: (row) => compact(row.calls, f.locale),
                },
                {
                  id: "tokens",
                  header: t("analytics.tokens"),
                  headClassName: "text-end",
                  cellClassName: "text-end tabular-nums",
                  cell: (row) => compact(row.input_tokens + row.output_tokens, f.locale),
                },
                {
                  id: "cost",
                  header: t("analytics.cost"),
                  headClassName: "text-end",
                  cellClassName: "text-end tabular-nums",
                  cell: (row) => usd(row.cost_usd, f.locale),
                },
                {
                  id: "errors",
                  header: t("analytics.errors"),
                  headClassName: "text-end",
                  cellClassName: "text-end tabular-nums",
                  cell: (row) => `${Math.round(row.error_rate * 1000) / 10}%`,
                },
              ]}
            />
          )}
        </QueryState>
      </CardContent>
    </Card>
  )
}
