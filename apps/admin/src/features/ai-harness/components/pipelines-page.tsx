"use client"

import {
  aiHarnessKeys,
  deleteAiPipeline,
  getAiConnectorsQuery,
  getAiPipelinesQuery,
  putAiPipeline,
  type AiConnector,
  type AiPipeline,
  type ReasoningEffort,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, PageContainer, Switch } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { REASONING, SEARCH_PIPELINE } from "../utils"
import { HarnessTabs } from "./harness-tabs"
import { TracingCard } from "./tracing-card"

/** Pipelines: which connector, model and reasoning effort each group of AI tasks uses; empty falls through to the environment. */
export function PipelinesPage() {
  const t = useT("aiHarness.pipelines")
  const th = useT("aiHarness")
  const pipelines = useQuery(getAiPipelinesQuery())
  const connectors = useQuery(getAiConnectorsQuery())
  return (
    <PageContainer title={th("title")}>
      <HarnessTabs />
      <p className="text-muted-foreground text-sm">{t("description")}</p>
      <TracingCard />
      <QueryState query={pipelines} rows={4} isEmpty={(data) => data.items.length === 0} emptyText={t("empty")}>
        {({ items }) => (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((item) => (
              <PipelineCard
                key={`${item.pipeline}:${JSON.stringify(item.route)}`}
                item={item}
                connectors={connectors.data?.items ?? []}
              />
            ))}
          </div>
        )}
      </QueryState>
    </PageContainer>
  )
}

function PipelineCard({ item, connectors }: { item: AiPipeline; connectors: readonly AiConnector[] }) {
  const t = useT("aiHarness.pipelines")
  const modelId = useId()
  const search = item.pipeline === SEARCH_PIPELINE
  const [connector, setConnector] = useState(item.route.connector_id ?? "")
  const [model, setModel] = useState(item.route.model ?? "")
  const [effort, setEffort] = useState<string>(item.route.reasoning_effort ?? "")
  // null keeps the default (admission untraced); a touched switch is stored explicitly
  const [tracing, setTracing] = useState<boolean | null>(item.route.tracing_enabled ?? null)
  const [capture, setCapture] = useState<boolean | null>(item.route.capture_content ?? null)
  const tracingOn = tracing ?? item.tracing.enabled
  const captureOn = capture ?? item.tracing.capture_content
  const allowed = connectors.filter((c) => c.enabled && (c.kind === "exa") === search)
  const efforts = {
    none: t("efforts.none"),
    minimal: t("efforts.minimal"),
    low: t("efforts.low"),
    medium: t("efforts.medium"),
    high: t("efforts.high"),
  }
  const save = useAdminMutation({
    mutationFn: () =>
      putAiPipeline(item.pipeline, {
        connector_id: connector || null,
        model: search ? null : model.trim() || null,
        reasoning_effort: search ? null : ((effort || null) as ReasoningEffort | null),
        tracing_enabled: tracing,
        capture_content: capture,
      }),
    invalidate: [aiHarnessKeys.all()],
    success: t("saved", { pipeline: item.pipeline }),
  })
  const reset = useAdminMutation({
    mutationFn: () => deleteAiPipeline(item.pipeline),
    invalidate: [aiHarnessKeys.all()],
    success: t("resetDone", { pipeline: item.pipeline }),
  })
  const routed =
    item.route.connector_id !== null ||
    item.route.model !== null ||
    item.route.reasoning_effort !== null ||
    item.route.tracing_enabled != null ||
    item.route.capture_content != null
  const { effective } = item
  return (
    <Card role="group" aria-label={item.pipeline}>
      <CardHeader className="gap-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span className="font-mono">{item.pipeline}</span>
          <Badge variant={effective.source === "runtime" ? "default" : "secondary"}>
            {effective.source === "runtime" ? t("runtime") : t("environment")}
          </Badge>
        </CardTitle>
        <p className="text-muted-foreground font-mono text-xs">{item.tasks.join(", ")}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <span className="text-muted-foreground">{t("effective")}</span>
          <span>{effective.connector_id}</span>
          {search ? null : (
            <>
              <span className="font-mono">{effective.model}</span>
              <span className="text-muted-foreground">{efforts[effective.reasoning_effort]}</span>
            </>
          )}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <LabeledField label={t("connector")} htmlFor={`${modelId}-connector`}>
            <SelectField
              id={`${modelId}-connector`}
              aria-label={t("connector")}
              value={connector}
              onChange={setConnector}
              emptyLabel={t("envDefault")}
              options={allowed.map((c) => ({ value: c.id, label: c.title }))}
            />
          </LabeledField>
          {search ? null : (
            <>
              <LabeledField label={t("model")} htmlFor={modelId}>
                <Input
                  id={modelId}
                  value={model}
                  placeholder={item.env_default.model}
                  onChange={(event) => setModel(event.target.value)}
                />
              </LabeledField>
              <LabeledField label={t("reasoning")} htmlFor={`${modelId}-reasoning`}>
                <SelectField
                  id={`${modelId}-reasoning`}
                  aria-label={t("reasoning")}
                  value={effort}
                  onChange={setEffort}
                  emptyLabel={t("envDefault")}
                  options={REASONING.map((value) => ({ value, label: efforts[value] }))}
                />
              </LabeledField>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
            <span>
              {t("tracing.enabled")}
              <span className="text-muted-foreground block text-xs">
                {item.tracing.default_enabled ? t("tracing.defaultOn") : t("tracing.defaultOff")}
              </span>
            </span>
            <Switch checked={tracingOn} onCheckedChange={(value: boolean) => setTracing(value)} />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
            <span>
              {t("tracing.capture")}
              <span className="text-muted-foreground block text-xs">{t("tracing.captureHint")}</span>
            </span>
            <Switch
              checked={tracingOn && captureOn}
              disabled={!tracingOn}
              onCheckedChange={(value: boolean) => setCapture(value)}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className={TOUCH} disabled={save.isPending} onClick={() => save.mutate(undefined)}>
            {t("save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            disabled={!routed || reset.isPending}
            onClick={() => reset.mutate(undefined)}
          >
            {t("reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
