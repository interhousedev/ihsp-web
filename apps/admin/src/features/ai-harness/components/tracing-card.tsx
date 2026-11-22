"use client"

import { aiHarnessKeys, deleteAiTracing, getAiTracingQuery, putAiTracing, type AiTracing } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** Langfuse project of the traces: host, public key and a write-only secret key. */
export function TracingCard() {
  const tracing = useQuery(getAiTracingQuery())
  return (
    <QueryState query={tracing} rows={2}>
      {(data) => <TracingForm key={`${data.source}:${data.updated_at ?? ""}`} data={data} />}
    </QueryState>
  )
}

function TracingForm({ data }: { data: AiTracing }) {
  const t = useT("aiHarness.tracing")
  const id = useId()
  const stored = data.source === "runtime"
  const [host, setHost] = useState(stored ? data.host : "")
  const [publicKey, setPublicKey] = useState(data.public_key ?? "")
  const [secret, setSecret] = useState("")
  const save = useAdminMutation({
    mutationFn: () =>
      putAiTracing({
        host: host.trim(),
        public_key: publicKey.trim(),
        ...(secret ? { secret_key: secret } : {}),
      }),
    invalidate: [aiHarnessKeys.all()],
    success: t("saved"),
  })
  const remove = useAdminMutation({
    mutationFn: () => deleteAiTracing(),
    invalidate: [aiHarnessKeys.all()],
    success: t("removed"),
  })
  const source = { runtime: t("source.runtime"), none: t("source.none") }[data.source]
  return (
    <Card role="group" aria-label={t("title")}>
      <CardHeader className="gap-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {t("title")}
          <Badge variant={stored ? "default" : "secondary"}>{source}</Badge>
        </CardTitle>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <LabeledField label={t("host")} htmlFor={`${id}-host`}>
            <Input id={`${id}-host`} type="url" value={host} onChange={(event) => setHost(event.target.value)} />
          </LabeledField>
          <LabeledField label={t("publicKey")} htmlFor={`${id}-public`}>
            <Input
              id={`${id}-public`}
              value={publicKey}
              autoComplete="off"
              onChange={(event) => setPublicKey(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("secretKey")} htmlFor={`${id}-secret`}>
            <Input
              id={`${id}-secret`}
              type="password"
              value={secret}
              autoComplete="new-password"
              placeholder={
                data.has_secret
                  ? data.secret_last4
                    ? t("secretStoredLast4", { last4: data.secret_last4 })
                    : t("secretStored")
                  : t("secretMissing")
              }
              onChange={(event) => setSecret(event.target.value)}
            />
          </LabeledField>
        </div>
        <p className="text-muted-foreground text-xs">{t("secretHint")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className={TOUCH}
            disabled={save.isPending || !publicKey.trim() || (!secret && !data.has_secret)}
            onClick={() => save.mutate(undefined)}
          >
            {t("save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            disabled={!stored || remove.isPending}
            onClick={() => remove.mutate(undefined)}
          >
            {t("remove")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
