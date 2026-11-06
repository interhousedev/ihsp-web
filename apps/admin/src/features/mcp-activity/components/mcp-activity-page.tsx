"use client"

import {
  getAdminMcpActivityQuery,
  getAdminMcpActivitySummaryQuery,
  MCP_OUTCOMES,
  type AdminMcpActivityItem,
  type McpOutcome,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Dropdown, Input, PageContainer, type DropdownOption } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useState } from "react"
import { QueryState } from "@ihsp/features-core"

const ALL = "all"
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function CallRow({ call }: { call: AdminMcpActivityItem }) {
  const t = useT("mcpActivity")
  const f = useFormatters()
  return (
    <li className="grid gap-1 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-sm font-medium break-all">{call.tool}</code>
        <Badge variant={call.outcome === "ok" ? "neutral" : "destructive"}>{t(`outcomes.${call.outcome}`)}</Badge>
        <Badge variant="outline">{call.server}</Badge>
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span>{f.dateTime(call.created_at)}</span>
        <code className="break-all">{call.user_id}</code>
        <span className="break-words">{call.connector_name ?? t("deletedKey")}</span>
        <span>{t("duration", { ms: call.duration_ms })}</span>
        {call.ip ? <span>{call.ip}</span> : null}
        {call.error_id ? <code>{call.error_id}</code> : null}
      </div>
    </li>
  )
}

/** MCP activity (admin, B1): calls and errors per tool, then every call with filters; each read is audited. */
export function McpActivityPage() {
  const t = useT("mcpActivity")
  const [{ outcome, user }, setFilters] = useQueryStates({
    outcome: parseAsStringLiteral(MCP_OUTCOMES),
    user: parseAsString,
  })
  const [cursors, setCursors] = useState<string[]>([])
  const userId = user && UUID_PATTERN.test(user) ? user : undefined
  const summary = useQuery(getAdminMcpActivitySummaryQuery())
  const query = useQuery(
    getAdminMcpActivityQuery({ outcome: outcome ?? undefined, user_id: userId, cursor: cursors.at(-1) }),
  )
  const options: DropdownOption[] = [
    { value: ALL, label: t("outcomeAll") },
    ...MCP_OUTCOMES.map((value) => ({ value, label: t(`outcomes.${value}`) })),
  ]

  return (
    <PageContainer title={t("title")}>
      <div className="flex flex-col gap-6">
        <section className="grid gap-2">
          <h2 className="font-medium">{t("summaryTitle")}</h2>
          <QueryState query={summary} rows={3} isEmpty={(result) => result.items.length === 0} emptyText={t("empty")}>
            {(result) => (
              <ul>
                {result.items.map((row) => (
                  <li
                    key={`${row.server}/${row.tool}`}
                    className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-b-0"
                  >
                    <code className="text-sm break-all">{row.tool}</code>
                    <span className="text-muted-foreground text-sm">
                      {t("counts", { calls: row.calls, errors: row.errors })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </section>

        <section className="grid gap-3">
          <h2 className="font-medium">{t("callsTitle")}</h2>
          <div className="grid gap-3 sm:max-w-2xl sm:grid-cols-2">
            <Dropdown
              aria-label={t("outcome")}
              value={outcome ?? ALL}
              options={options}
              onValueChange={(value) => {
                setCursors([])
                void setFilters({ outcome: value === ALL ? null : (value as McpOutcome) })
              }}
            />
            <Input
              aria-label={t("userId")}
              placeholder={t("userId")}
              value={user ?? ""}
              onChange={(event) => {
                setCursors([])
                void setFilters({ user: event.target.value || null })
              }}
            />
          </div>
          <QueryState query={query} rows={5} isEmpty={(result) => result.items.length === 0} emptyText={t("empty")}>
            {(page) => (
              <div className="grid gap-3">
                <ul>
                  {page.items.map((call) => (
                    <CallRow key={call.id} call={call} />
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={cursors.length === 0}
                    onClick={() => setCursors((list) => list.slice(0, -1))}
                  >
                    {t("newer")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={!page.next_cursor}
                    onClick={() => setCursors((list) => (page.next_cursor ? [...list, page.next_cursor] : list))}
                  >
                    {t("older")}
                  </Button>
                </div>
              </div>
            )}
          </QueryState>
        </section>
      </div>
    </PageContainer>
  )
}
