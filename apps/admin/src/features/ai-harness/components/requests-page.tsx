"use client"

import { getAiPromptVersionsQuery, getAiRequestsQuery, type AiRequestItem } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageContainer, ResponsiveTable } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"
import { SelectField } from "../../shared/components/select-field"
import { TOUCH } from "../../shared/utils/touch"
import { compact } from "../../limits/utils"
import { HarnessTabs } from "./harness-tabs"
import { PromptVersionDiff } from "./prompt-version-diff"

/** Requests: the AI calls modules register, the pipeline each belongs to, their arguments and prompt versions. */
export function RequestsPage() {
  const t = useT("aiHarness.requests")
  const th = useT("aiHarness")
  const [pipeline, setPipeline] = useQueryState("pipeline", parseAsString.withDefault(""))
  const [selected, setSelected] = useQueryState("request", parseAsString)
  const all = useQuery(getAiRequestsQuery())
  const query = useQuery(getAiRequestsQuery(pipeline ? { pipeline } : undefined))
  const pipelines = [...new Set((all.data?.items ?? []).map((item) => item.pipeline))].sort()
  return (
    <PageContainer title={th("title")}>
      <HarnessTabs />
      <div className="max-w-xs">
        <SelectField
          aria-label={t("pipeline")}
          value={pipeline}
          onChange={(value) => void setPipeline(value || null)}
          emptyLabel={t("allPipelines")}
          options={pipelines.map((value) => ({ value, label: value }))}
        />
      </div>
      <QueryState query={query} rows={5} isEmpty={(data) => data.items.length === 0} emptyText={t("empty")}>
        {({ items }) => (
          <>
            <ResponsiveTable
              label={t("title")}
              rows={items}
              rowKey={(row) => row.id}
              columns={[
                {
                  id: "id",
                  header: t("columns.request"),
                  role: "title",
                  cell: (row) => (
                    <button
                      type="button"
                      aria-label={t("open", { id: row.id })}
                      className="text-start font-mono text-xs underline-offset-4 hover:underline"
                      onClick={() => void setSelected(row.id)}
                    >
                      {row.id}
                    </button>
                  ),
                },
                { id: "pipeline", header: t("columns.pipeline"), cell: (row) => row.pipeline },
                { id: "owner", header: t("columns.owner"), cell: (row) => row.owner_app },
                {
                  id: "version",
                  header: t("columns.version"),
                  cell: (row) => (
                    <span className="flex flex-wrap items-center gap-1">
                      <span>{row.active_version === 0 ? t("builtin") : `v${row.active_version}`}</span>
                      {row.code_changed_since_active ? <Badge variant="outline">{t("codeChanged")}</Badge> : null}
                      {row.retired ? <Badge variant="secondary">{t("retired")}</Badge> : null}
                    </span>
                  ),
                },
              ]}
            />
            {items.find((item) => item.id === selected) ? (
              <RequestDetail key={selected} item={items.find((item) => item.id === selected)!} />
            ) : null}
          </>
        )}
      </QueryState>
    </PageContainer>
  )
}

type SchemaProperty = { type?: string }

function RequestDetail({ item }: { item: AiRequestItem }) {
  const t = useT("aiHarness.requests")
  const f = useFormatters()
  const slot = item.template_id.split("/")
  const ref = { task: slot[0] ?? item.task, name: slot[1] ?? "" }
  const versions = useQuery(getAiPromptVersionsQuery(ref))
  const [diffOf, setDiffOf] = useState<number | null>(null)
  const properties = (item.args_schema.properties ?? {}) as Record<string, SchemaProperty>
  const required = new Set((item.args_schema.required ?? []) as string[])
  const sourceLabels = { admin: t("source.admin"), code: t("source.code") }
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="font-mono text-base">{item.id}</CardTitle>
        {item.summary ? <p className="text-muted-foreground text-sm">{item.summary}</p> : null}
        <p className="text-muted-foreground text-xs">
          {t("template")}: <span className="font-mono">{item.template_id}</span>
          {item.tools.length > 0 ? ` · ${t("tools")}: ${item.tools.join(", ")}` : ""}
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <section aria-label={t("arguments")} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("arguments")}</h3>
          {Object.keys(properties).length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noArguments")}</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {Object.entries(properties).map(([name, schema]) => (
                <li key={name} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                  <code>{name}</code>
                  <span className="text-muted-foreground text-xs">
                    {schema.type ?? "any"}
                    {required.has(name) ? ` · ${t("required")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-label={t("versions")} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("versions")}</h3>
          <QueryState query={versions} rows={3} isEmpty={(data) => data.items.length === 0} emptyText={t("noVersions")}>
            {({ items }) => (
              <ul className="flex flex-col divide-y">
                {items.map((version) => (
                  <li
                    key={`${version.locale}:${version.version}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        v{version.version}
                        <Badge variant="outline">{sourceLabels[version.source]}</Badge>
                        {version.active ? <Badge>{t("active")}</Badge> : null}
                      </span>
                      <span className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                        <span>{f.dateTime(new Date(version.created_at))}</span>
                        <span>{t("size", { tokens: compact(version.tokens_est, f.locale) })}</span>
                      </span>
                    </div>
                    {version.has_diff ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={TOUCH}
                        aria-pressed={diffOf === version.version}
                        aria-label={t("diffVersion", { version: version.version })}
                        onClick={() => setDiffOf(diffOf === version.version ? null : version.version)}
                      >
                        {t("diff")}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
          {diffOf !== null ? <PromptVersionDiff {...ref} to={diffOf} /> : null}
        </section>
      </CardContent>
    </Card>
  )
}
