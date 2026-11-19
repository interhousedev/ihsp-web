"use client"

import { getAdminPromptCallsQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardHeader, CardTitle, ResponsiveTable } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { compact, usd } from "../../limits/utils"

/** The latest model calls of a task: time, model, version, tokens, cost, latency and outcome. The ledger holds no text. */
export function PromptCalls({ task }: { task: string }) {
  const t = useT("prompts")
  const f = useFormatters()
  const query = useQuery(getAdminPromptCallsQuery({ task, limit: 50 }))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("calls.title", { task })}</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState query={query} rows={3} isEmpty={(data) => data.items.length === 0} emptyText={t("calls.empty")}>
          {({ items }) => (
            <ResponsiveTable
              label={t("calls.title", { task })}
              rows={items}
              rowKey={(row) => `${row.occurred_at}:${row.model}:${row.input_tokens}:${row.output_tokens}`}
              columns={[
                { id: "time", header: t("calls.time"), role: "title", cell: (row) => f.dateTime(row.occurred_at) },
                { id: "model", header: t("calls.model"), cell: (row) => row.model },
                {
                  id: "version",
                  header: t("analytics.version"),
                  cell: (row) => (row.version === 0 ? t("editor.builtin") : `v${row.version}`),
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
                  cell: (row) => (row.cost_usd === null ? "—" : usd(row.cost_usd, f.locale)),
                },
                {
                  id: "latency",
                  header: t("calls.latency"),
                  headClassName: "text-end",
                  cellClassName: "text-end tabular-nums",
                  cell: (row) => (row.latency_ms === null ? "—" : t("calls.ms", { value: row.latency_ms })),
                },
                {
                  id: "status",
                  header: t("calls.status"),
                  role: "action",
                  cell: (row) =>
                    row.success ? (
                      <Badge variant="secondary">{t("calls.ok")}</Badge>
                    ) : (
                      <Badge variant="destructive">
                        {row.error && t.has(`calls.errorKinds.${row.error}`)
                          ? t(`calls.errorKinds.${row.error}`)
                          : (row.error ?? t("calls.failed"))}
                      </Badge>
                    ),
                },
              ]}
            />
          )}
        </QueryState>
      </CardContent>
    </Card>
  )
}
