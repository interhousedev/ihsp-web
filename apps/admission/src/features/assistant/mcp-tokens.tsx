"use client"

import {
  deleteIdPersonalToken,
  getIdPersonalTokensQuery,
  postIdPersonalTokens,
  postStepUp,
  type PersonalTokenCreated,
} from "@ihsp/api"
import { CopyLinkButton } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Checkbox, Icons, Input, Label } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { type McpConnection, type McpScope, useAdmissionTokens } from "./mcp-api"

const TOKEN_PLACEHOLDER = "<personal token>"

function configWith(connection: McpConnection, token: string): string {
  return JSON.stringify(connection.example_config, null, 2).replace(TOKEN_PLACEHOLDER, token)
}

/** Creates a personal token with the chosen scopes; the secret and the ready config are shown once. */
export function McpTokenCreate({ connection, codeResetKey }: { connection: McpConnection; codeResetKey: number }) {
  const t = useT("assistantDock.mcp")
  const queryClient = useQueryClient()
  const nameId = useId()
  const codeId = useId()
  const [name, setName] = useState("")
  const [scopes, setScopes] = useState<McpScope[]>(connection.scopes)
  const [days, setDays] = useState<30 | 90>(connection.max_expiry_days >= 90 ? 90 : 30)
  const tc = useT("idCommon")
  const [code, setCode] = useState("")
  const [created, setCreated] = useState<PersonalTokenCreated | null>(null)

  // The step-up code is single-use: a revoke spends it, so the field starts empty again.
  useEffect(() => {
    setCode("")
  }, [codeResetKey])

  const create = useMutation({
    mutationFn: () => postIdPersonalTokens({ name: name.trim(), scopes, expires_in_days: days, otp_code: code }),
    onSuccess: (result) => {
      setCreated(result)
      setName("")
      void queryClient.invalidateQueries({ queryKey: getIdPersonalTokensQuery().queryKey })
    },
    onError: () => toast.error(t("createFailed")),
  })
  const sendCode = useMutation({
    mutationFn: () => postStepUp(),
    onError: () => toast.error(t("codeFailed")),
  })

  function toggle(scope: McpScope, on: boolean) {
    setScopes((current) => (on ? [...current, scope] : current.filter((s) => s !== scope)))
  }

  if (created) {
    const config = configWith(connection, created.token)
    return (
      <div className="flex flex-col gap-3" data-testid="mcp-token-created">
        <p className="text-sm font-medium">{t("shownOnce")}</p>
        <code className="bg-muted rounded-md p-3 text-xs break-all">{created.token}</code>
        <pre className="bg-muted max-w-full overflow-x-auto rounded-md p-3 text-xs whitespace-pre">{config}</pre>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton value={created.token} label={t("copyToken")} />
          <CopyLinkButton value={config} label={t("copyConfig")} />
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => setCreated(null)}>
            {t("done")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim() && scopes.length > 0 && code.length === 6) create.mutate()
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>{t("name")}</Label>
        <Input id={nameId} value={name ?? ""} maxLength={80} onChange={(event) => setName(event.target.value)} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("scopes")}</legend>
        {connection.scopes.map((scope) => (
          <label key={scope} className="flex min-h-9 items-center gap-2 text-sm">
            <Checkbox checked={scopes.includes(scope)} onCheckedChange={(on) => toggle(scope, on === true)} />
            {t(`scope.${scope.split(":")[1] as "read" | "memory" | "docs" | "documents"}`)}
          </label>
        ))}
      </fieldset>
      <fieldset className="flex gap-2">
        <legend className="mb-1 text-sm font-medium">{t("expiry")}</legend>
        {([30, 90] as const)
          .filter((option) => option <= connection.max_expiry_days)
          .map((option) => (
            <Button
              key={option}
              type="button"
              variant={days === option ? "default" : "outline"}
              className="min-h-11"
              aria-pressed={days === option}
              onClick={() => setDays(option)}
            >
              {t("days", { days: option })}
            </Button>
          ))}
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor={codeId}>{tc("code")}</Label>
        <div className="flex gap-2">
          <Input
            id={codeId}
            value={code ?? ""}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={sendCode.isPending}
            onClick={() => sendCode.mutate()}
          >
            {sendCode.isSuccess ? tc("stepUp.sendAgain") : tc("stepUp.send")}
          </Button>
        </div>
        {sendCode.isSuccess ? <p className="text-muted-foreground text-sm">{tc("stepUp.sent")}</p> : null}
      </div>
      <Button
        type="submit"
        className="min-h-11"
        disabled={!name.trim() || scopes.length === 0 || code.length !== 6 || create.isPending}
      >
        {t("create")}
      </Button>
    </form>
  )
}

export function McpTokenList({ onRevoked }: { onRevoked: () => void }) {
  const t = useT("assistantDock.mcp")
  const format = useFormatters()
  const queryClient = useQueryClient()
  const tokens = useAdmissionTokens()
  const revoke = useMutation({
    mutationFn: (id: string) => deleteIdPersonalToken(id),
    onSuccess: () => {
      onRevoked()
      return queryClient.invalidateQueries({ queryKey: getIdPersonalTokensQuery().queryKey })
    },
    onError: () => toast.error(t("revokeFailed")),
  })

  if (!tokens.data?.length) return <p className="text-muted-foreground text-sm">{t("noTokens")}</p>
  return (
    <ul className="flex flex-col gap-2">
      {tokens.data.map((token) => (
        <li key={token.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{token.name}</p>
            <p className="text-muted-foreground text-xs">
              {token.prefix}… ·{" "}
              {t("expiresOn", { date: format.date(token.expires_at, { day: "numeric", month: "short" }) })}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label={t("revoke", { name: token.name })}
            disabled={revoke.isPending}
            onClick={() => revoke.mutate(token.id)}
          >
            <Icons.trash className="size-4" aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  )
}
