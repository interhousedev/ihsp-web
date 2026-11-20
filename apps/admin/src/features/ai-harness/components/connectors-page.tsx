"use client"

import {
  aiHarnessKeys,
  deleteAiConnector,
  getAiConnectorsQuery,
  testAiConnector,
  type AiConnector,
  type AiConnectorTestResult,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog, PageContainer, ResponsiveTable } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { ConnectorDialog } from "./connector-dialog"
import { HarnessTabs } from "./harness-tabs"

/** Connectors: the provider endpoints the AI calls go through. Secrets are write-only; only the last four show. */
export function ConnectorsPage() {
  const t = useT("aiHarness.connectors")
  const th = useT("aiHarness")
  const query = useQuery(getAiConnectorsQuery())
  const [editing, setEditing] = useState<AiConnector | "new" | null>(null)
  const [removing, setRemoving] = useState<AiConnector | null>(null)
  const [tests, setTests] = useState<Record<string, AiConnectorTestResult>>({})
  const test = useAdminMutation<AiConnector, AiConnectorTestResult>({
    mutationFn: (connector) => testAiConnector(connector.id),
    onSuccess: (result, connector) => setTests((current) => ({ ...current, [connector.id]: result })),
  })
  const remove = useAdminMutation<AiConnector>({
    mutationFn: (connector) => deleteAiConnector(connector.id),
    invalidate: [aiHarnessKeys.all()],
    success: t("removed"),
    onSuccess: () => setRemoving(null),
  })
  const kindLabels = {
    openrouter: t("kinds.openrouter"),
    anthropic: t("kinds.anthropic"),
    openai_compatible: t("kinds.openai_compatible"),
    exa: t("kinds.exa"),
  }
  return (
    <PageContainer
      title={th("title")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setEditing("new")}>
          {t("add")}
        </Button>
      }
    >
      <HarnessTabs />
      <QueryState query={query} rows={4} isEmpty={(data) => data.items.length === 0} emptyText={t("empty")}>
        {({ items, kinds }) => (
          <>
            <ResponsiveTable
              label={t("title")}
              rows={items}
              rowKey={(row) => row.id}
              columns={[
                {
                  id: "title",
                  header: t("columns.title"),
                  role: "title",
                  cell: (row) => (
                    <span className="flex flex-col">
                      <span className="font-medium">{row.title}</span>
                      <span className="text-muted-foreground font-mono text-xs">{row.id}</span>
                    </span>
                  ),
                },
                { id: "kind", header: t("columns.kind"), cell: (row) => kindLabels[row.kind] },
                {
                  id: "secret",
                  header: t("columns.secret"),
                  cell: (row) =>
                    row.has_secret ? (
                      <span className="font-mono text-xs">…{row.secret_last4}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">{t("noSecret")}</span>
                    ),
                },
                {
                  id: "status",
                  header: t("columns.status"),
                  cell: (row) => (
                    <span className="flex flex-wrap items-center gap-1">
                      <Badge variant={row.enabled ? "default" : "secondary"}>
                        {row.enabled ? t("enabled") : t("disabled")}
                      </Badge>
                      {row.source === "env" ? <Badge variant="outline">{t("fromEnv")}</Badge> : null}
                    </span>
                  ),
                },
                {
                  id: "test",
                  header: t("columns.test"),
                  cell: (row) => {
                    const result = tests[row.id]
                    return (
                      <span className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={test.isPending}
                          aria-label={t("testConnector", { title: row.title })}
                          onClick={() => test.mutate(row)}
                        >
                          {t("test")}
                        </Button>
                        {result ? (
                          <span className={result.ok ? "text-sm" : "text-destructive text-sm"}>
                            {result.ok
                              ? t("testOk", { ms: result.latency_ms ?? 0 })
                              : t("testFailed", { error: result.error ?? "" })}
                          </span>
                        ) : null}
                      </span>
                    )
                  },
                },
                {
                  id: "actions",
                  header: t("columns.actions"),
                  role: "action",
                  cell: (row) => (
                    <span className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label={t("editConnector", { title: row.title })}
                        onClick={() => setEditing(row)}
                      >
                        {t("edit")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label={t("removeConnector", { title: row.title })}
                        onClick={() => setRemoving(row)}
                      >
                        {t("remove")}
                      </Button>
                    </span>
                  ),
                },
              ]}
            />
            <ConnectorDialog
              key={editing === null ? "closed" : editing === "new" ? "new" : editing.id}
              open={editing !== null}
              connector={editing === "new" ? null : editing}
              kinds={kinds}
              onOpenChange={(open) => (open ? undefined : setEditing(null))}
            />
          </>
        )}
      </QueryState>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => (open ? undefined : setRemoving(null))}
        title={t("removeTitle", { title: removing?.title ?? "" })}
        description={removing?.builtin ? t("removeBuiltin") : t("removeDescription")}
        confirmLabel={t("remove")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (removing) remove.mutate(removing)
        }}
      />
    </PageContainer>
  )
}
