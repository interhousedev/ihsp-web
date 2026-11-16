"use client"

import { getAdminPromptAnalyticsQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("analytics.task")}</TableHead>
                  <TableHead>{t("analytics.version")}</TableHead>
                  <TableHead className="text-end">{t("analytics.calls")}</TableHead>
                  <TableHead className="text-end">{t("analytics.tokens")}</TableHead>
                  <TableHead className="text-end">{t("analytics.cost")}</TableHead>
                  <TableHead className="text-end">{t("analytics.errors")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={`${row.task}:${row.version}`}>
                    <TableCell>{row.task}</TableCell>
                    <TableCell>{row.version === 0 ? t("editor.builtin") : `v${row.version}`}</TableCell>
                    <TableCell className="text-end tabular-nums">{compact(row.calls, f.locale)}</TableCell>
                    <TableCell className="text-end tabular-nums">
                      {compact(row.input_tokens + row.output_tokens, f.locale)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{usd(row.cost_usd, f.locale)}</TableCell>
                    <TableCell className="text-end tabular-nums">{Math.round(row.error_rate * 1000) / 10}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </QueryState>
      </CardContent>
    </Card>
  )
}
