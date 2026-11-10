"use client"

import { getIdMeConnectorsActivityQuery, MCP_OUTCOMES, type McpActivityItem, type McpOutcome } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Badge, Button, Dropdown, PageContainer, StateView, type DropdownOption } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useState } from "react"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"

const ALL = "all"

function CallRow({ call }: { call: McpActivityItem }) {
  const t = useTr()
  const format = useFormatters()
  return (
    <li className="grid gap-1 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-sm font-medium break-all">{call.tool}</code>
        <Badge variant={call.outcome === "ok" ? "secondary" : "destructive"}>
          {t(`connectors.activity.outcomes.${call.outcome}`)}
        </Badge>
        {call.read_only ? null : <Badge variant="outline">{t("connectors.activity.write")}</Badge>}
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span>{format.dateTime(call.created_at)}</span>
        <span className="break-words">{call.connector_name ?? t("connectors.activity.deletedKey")}</span>
        <span>{t("connectors.activity.duration", { ms: call.duration_ms })}</span>
        {call.ip ? <span>{call.ip}</span> : null}
        {call.error_id ? <code>{call.error_id}</code> : null}
      </div>
    </li>
  )
}

/** `/connectors/activity/` (B1): what the user's MCP keys did; redacted, kept for 90 days. */
export function ConnectorActivityPage() {
  const t = useTr()
  const [{ outcome, connector }, setFilters] = useQueryStates({
    outcome: parseAsStringLiteral(MCP_OUTCOMES),
    connector: parseAsString,
  })
  const [cursors, setCursors] = useState<string[]>([])
  const query = useQuery(
    getIdMeConnectorsActivityQuery({
      outcome: outcome ?? undefined,
      connector_id: connector ?? undefined,
      cursor: cursors.at(-1),
    }),
  )
  const options: DropdownOption[] = [
    { value: ALL, label: t("connectors.activity.outcomeAll") },
    ...MCP_OUTCOMES.map((value) => ({ value, label: t(`connectors.activity.outcomes.${value}`) })),
  ]
  return (
    <PageContainer title={t("connectors.activity.title")}>
      <div className="grid gap-4">
        <div className="sm:max-w-xs">
          <Dropdown
            aria-label={t("connectors.activity.outcome")}
            value={outcome ?? ALL}
            options={options}
            onValueChange={(value) => {
              setCursors([])
              void setFilters({ outcome: value === ALL ? null : (value as McpOutcome) })
            }}
          />
        </div>
        <QueryBoundary query={query}>
          {(page) =>
            page.items.length === 0 ? (
              <StateView state="empty" emptyText={t("connectors.activity.empty")} />
            ) : (
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
                    {t("connectors.activity.newer")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={!page.next_cursor}
                    onClick={() => setCursors((list) => (page.next_cursor ? [...list, page.next_cursor] : list))}
                  >
                    {t("connectors.activity.older")}
                  </Button>
                </div>
              </div>
            )
          }
        </QueryBoundary>
      </div>
    </PageContainer>
  )
}
