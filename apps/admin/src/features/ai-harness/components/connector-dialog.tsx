"use client"

import {
  aiHarnessKeys,
  createAiConnector,
  patchAiConnector,
  type AiConnector,
  type AiConnectorPatchBody,
  type ConnectorKind,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input, ResponsiveDialog } from "@ihsp/ui"
import { useId, useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

const SLUG = /^[a-z][a-z0-9_-]{1,47}$/

/** Adds a connector or edits one. The key is write-only: it is sent, never read back, and cleared on close. */
export function ConnectorDialog({
  open,
  connector,
  kinds,
  onOpenChange,
}: {
  open: boolean
  connector: AiConnector | null
  kinds: readonly ConnectorKind[]
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("aiHarness.connectors")
  const ids = { id: useId(), title: useId(), url: useId(), key: useId() }
  const [id, setId] = useState(connector?.id ?? "")
  const [kind, setKind] = useState<ConnectorKind>(connector?.kind ?? "openai_compatible")
  const [title, setTitle] = useState(connector?.title ?? "")
  const [baseUrl, setBaseUrl] = useState(connector?.base_url ?? "")
  const [apiKey, setApiKey] = useState("")
  const [enabled, setEnabled] = useState(connector?.enabled ?? true)
  const kindLabels = {
    openrouter: t("kinds.openrouter"),
    anthropic: t("kinds.anthropic"),
    openai_compatible: t("kinds.openai_compatible"),
    exa: t("kinds.exa"),
  }
  const save = useAdminMutation<void, AiConnector>({
    mutationFn: () => {
      const url = kind === "openai_compatible" ? baseUrl.trim() : null
      if (connector === null)
        return createAiConnector({
          id: id.trim(),
          kind,
          title: title.trim(),
          ...(url ? { base_url: url } : {}),
          ...(apiKey ? { api_key: apiKey } : {}),
        })
      const body: AiConnectorPatchBody = { title: title.trim(), enabled }
      if (kind === "openai_compatible") body.base_url = url
      if (apiKey) body.api_key = apiKey
      return patchAiConnector(connector.id, body)
    },
    invalidate: [aiHarnessKeys.all()],
    success: t(connector === null ? "added" : "saved"),
    onSuccess: () => {
      setApiKey("")
      onOpenChange(false)
    },
  })
  const valid =
    title.trim() !== "" &&
    (connector !== null || SLUG.test(id.trim())) &&
    (kind !== "openai_compatible" || baseUrl.trim() !== "")
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={connector === null ? t("addTitle") : t("editTitle", { title: connector.title })}
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) save.mutate()
      }}
      footer={
        <>
          <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" className={TOUCH} disabled={!valid || save.isPending}>
            {connector === null ? t("submitAdd") : t("submitSave")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {connector === null ? (
          <>
            <LabeledField label={t("fields.id")} htmlFor={ids.id} description={t("fields.idHint")} required>
              <Input id={ids.id} value={id} maxLength={48} onChange={(event) => setId(event.target.value)} />
            </LabeledField>
            <LabeledField label={t("fields.kind")} htmlFor="ai-connector-kind">
              <SelectField
                id="ai-connector-kind"
                aria-label={t("fields.kind")}
                value={kind}
                onChange={(value) => setKind(value as ConnectorKind)}
                options={kinds.map((value) => ({ value, label: kindLabels[value] }))}
              />
            </LabeledField>
          </>
        ) : null}
        <LabeledField label={t("fields.title")} htmlFor={ids.title} required>
          <Input id={ids.title} value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
        </LabeledField>
        {kind === "openai_compatible" ? (
          <LabeledField label={t("fields.baseUrl")} htmlFor={ids.url} required>
            <Input
              id={ids.url}
              type="url"
              inputMode="url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
          </LabeledField>
        ) : null}
        <LabeledField
          label={t("fields.apiKey")}
          htmlFor={ids.key}
          description={
            connector?.has_secret ? t("fields.apiKeyKeep", { last4: connector.secret_last4 ?? "" }) : undefined
          }
        >
          <Input
            id={ids.key}
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </LabeledField>
        {connector !== null ? <CheckField checked={enabled} onChange={setEnabled} label={t("fields.enabled")} /> : null}
      </div>
    </ResponsiveDialog>
  )
}
