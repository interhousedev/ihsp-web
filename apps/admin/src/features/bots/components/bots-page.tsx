"use client"

import type { Bot, BotFeatureName } from "@ihsp/api"
import { CodeInput, StepUpSender } from "@ihsp/features-core/id-account"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, PageContainer, Switch } from "@ihsp/ui"
import { useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { TOUCH } from "../../shared/utils/touch"
import { useAddBot, useAnnounce, useBots, useDraftBroadcasts, useRotateBotToken, useUpdateBot } from "../hooks/use-bots"

export const BOT_FEATURES: readonly BotFeatureName[] = [
  "ai_agent",
  "open_ai_agent",
  "commands",
  "notifications",
  "announcements",
  "mini_app",
]

export function BotsPage() {
  const t = useT("bots")
  const query = useBots()

  if (query.isPending)
    return (
      <PageContainer title={t("title")}>
        <p className="text-muted-foreground text-sm">{t("loading")}</p>
      </PageContainer>
    )
  if (query.isError || !query.data)
    return (
      <PageContainer title={t("title")}>
        <p className="text-destructive text-sm">{t("loadFailed")}</p>
      </PageContainer>
    )

  const bots = query.data.items
  return (
    <PageContainer title={t("title")}>
      <div className="flex flex-col gap-6">
        <AddBotForm />
        {bots.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {bots.map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        )}
        <AnnounceForm bots={bots} />
      </div>
    </PageContainer>
  )
}

/** Every bot write (add, edit, new token, announcement) asks for a step-up code. */
function StepUpCode({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT("bots")
  return (
    <div className="grid gap-3">
      <CodeInput value={value} onChange={onChange} label={t("stepUp.code")} />
      <StepUpSender />
    </div>
  )
}

const codeReady = (code: string) => code.trim().length >= 4

function AddBotForm() {
  const t = useT("bots")
  const [name, setName] = useState("")
  const [token, setToken] = useState("")
  const [code, setCode] = useState("")
  const errorMessage = useErrorMessage()
  const add = useAddBot(() => {
    setName("")
    setToken("")
    setCode("")
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("add.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 md:grid-cols-2 md:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            add.mutate({ name: name.trim(), token: token.trim(), otp_code: code.trim() })
          }}
        >
          <LabeledField label={t("add.name")} htmlFor="bot-name" required>
            <Input
              id="bot-name"
              className={TOUCH}
              value={name}
              maxLength={64}
              onChange={(event) => setName(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("add.token")} htmlFor="bot-token" required description={t("add.tokenHint")}>
            <Input
              id="bot-token"
              className={TOUCH}
              type="password"
              autoComplete="off"
              value={token}
              aria-invalid={add.isError}
              aria-describedby={add.isError ? "bot-token-error" : undefined}
              onChange={(event) => {
                setToken(event.target.value)
                if (add.isError) add.reset()
              }}
            />
            {add.isError ? (
              <p id="bot-token-error" role="alert" className="text-destructive text-sm">
                {errorMessage(add.error)}
              </p>
            ) : null}
          </LabeledField>
          <div className="md:col-span-2">
            <StepUpCode value={code} onChange={setCode} />
          </div>
          <Button
            type="submit"
            className={`${TOUCH} md:justify-self-start`}
            disabled={add.isPending || !name.trim() || token.trim().length < 20 || !codeReady(code)}
          >
            {t("add.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

type BotDraft = { enabled?: boolean; features: Partial<Record<BotFeatureName, boolean>> }

const EMPTY_DRAFT: BotDraft = { features: {} }

function BotCard({ bot }: { bot: Bot }) {
  const t = useT("bots")
  const [draft, setDraft] = useState<BotDraft>(EMPTY_DRAFT)
  const [editCode, setEditCode] = useState("")
  const update = useUpdateBot(() => {
    setDraft(EMPTY_DRAFT)
    setEditCode("")
  })
  const [token, setToken] = useState("")
  const [code, setCode] = useState("")
  const rotate = useRotateBotToken(() => {
    setToken("")
    setCode("")
  })
  const switchId = `bot-enabled-${bot.id}`
  const enabled = draft.enabled ?? bot.enabled
  const changedFeatures = Object.fromEntries(
    Object.entries(draft.features).filter(([name, value]) => bot.features[name as BotFeatureName] !== value),
  )
  const enabledChanged = draft.enabled !== undefined && draft.enabled !== bot.enabled
  const dirty = enabledChanged || Object.keys(changedFeatures).length > 0
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{bot.name}</span>
          <span className="text-muted-foreground text-sm font-normal">@{bot.username}</span>
          {bot.is_default ? <Badge variant="secondary">{t("default")}</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="text-muted-foreground grid grid-cols-2 gap-1 text-sm">
          <dt>{t("token")}</dt>
          <dd className="font-mono">{bot.token_mask}</dd>
          <dt>{t("members")}</dt>
          <dd>{bot.members}</dd>
        </dl>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            update.mutate({
              id: bot.id,
              body: {
                ...(enabledChanged ? { enabled } : {}),
                ...(Object.keys(changedFeatures).length ? { features: changedFeatures } : {}),
                otp_code: editCode.trim(),
              },
            })
          }}
        >
          <label htmlFor={switchId} className="flex min-h-11 items-center justify-between gap-3 text-sm md:min-h-8">
            <span>{t("enabled")}</span>
            <Switch
              id={switchId}
              checked={enabled}
              disabled={bot.is_default || update.isPending}
              onCheckedChange={(checked) => setDraft((current) => ({ ...current, enabled: checked }))}
            />
          </label>
          {bot.is_default ? <p className="text-muted-foreground text-xs">{t("defaultHint")}</p> : null}
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium">{t("features.title")}</legend>
            {BOT_FEATURES.map((feature) => (
              <CheckField
                key={feature}
                checked={draft.features[feature] ?? bot.features[feature]}
                disabled={update.isPending || !enabled}
                label={t(`features.${feature}`)}
                onChange={(checked) =>
                  setDraft((current) => ({ ...current, features: { ...current.features, [feature]: checked } }))
                }
              />
            ))}
          </fieldset>
          {dirty ? (
            <>
              <StepUpCode value={editCode} onChange={setEditCode} />
              <Button
                type="submit"
                className={`${TOUCH} self-start`}
                disabled={update.isPending || !codeReady(editCode)}
              >
                {t("edit.submit")}
              </Button>
            </>
          ) : null}
        </form>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            rotate.mutate({ id: bot.id, token: token.trim(), otp_code: code.trim() })
          }}
        >
          <LabeledField label={t("rotate.label")} htmlFor={`bot-rotate-${bot.id}`} className="flex-1">
            <Input
              id={`bot-rotate-${bot.id}`}
              type="password"
              autoComplete="off"
              className={TOUCH}
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </LabeledField>
          {token.trim().length >= 20 ? <StepUpCode value={code} onChange={setCode} /> : null}
          <Button
            type="submit"
            variant="outline"
            className={`${TOUCH} self-start`}
            disabled={rotate.isPending || token.trim().length < 20 || !codeReady(code)}
          >
            {t("rotate.submit")}
          </Button>
        </form>
        {bot.is_default ? <p className="text-muted-foreground text-xs">{t("rotate.defaultHint")}</p> : null}
      </CardContent>
    </Card>
  )
}

function AnnounceForm({ bots }: { bots: Bot[] }) {
  const t = useT("bots")
  const drafts = useDraftBroadcasts()
  const [broadcastId, setBroadcastId] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [code, setCode] = useState("")
  const announce = useAnnounce(() => {
    setBroadcastId("")
    setSelected([])
    setCode("")
  })
  const usable = bots.filter((bot) => bot.enabled && bot.features.announcements)
  const options = (drafts.data?.items ?? []).map((item) => ({ value: item.id, label: item.title }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("announce.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            announce.mutate({ broadcast_id: broadcastId, bot_ids: selected, otp_code: code.trim() })
          }}
        >
          <LabeledField label={t("announce.broadcast")} htmlFor="announce-broadcast">
            <SelectField
              id="announce-broadcast"
              value={broadcastId}
              onChange={setBroadcastId}
              options={options}
              emptyLabel={options.length ? t("announce.pick") : t("announce.noDrafts")}
            />
          </LabeledField>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium">{t("announce.bots")}</legend>
            {usable.length === 0 ? <p className="text-muted-foreground text-sm">{t("announce.noBots")}</p> : null}
            {usable.map((bot) => (
              <CheckField
                key={bot.id}
                checked={selected.includes(bot.id)}
                label={`${bot.name} (@${bot.username})`}
                onChange={(checked) =>
                  setSelected((current) => (checked ? [...current, bot.id] : current.filter((id) => id !== bot.id)))
                }
              />
            ))}
          </fieldset>
          <StepUpCode value={code} onChange={setCode} />
          <Button
            type="submit"
            className="self-start"
            disabled={announce.isPending || !broadcastId || selected.length === 0 || !codeReady(code)}
          >
            {t("announce.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
