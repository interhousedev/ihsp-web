"use client"

import { deleteIdPersonalToken, getIdPersonalTokensQuery, postStepUp, type PersonalTokenCreated } from "@ihsp/api"
import { createCatalogToken, OtpInvalidError } from "../api"
import { CopyLinkButton } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"

const SCOPE = "admission:catalog"
/** The backend allows 30, 90 or 365 days and caps a catalog token at 90. */
const DAYS = [30, 90] as const

function TokenList() {
  const t = useT("catalogFacts")
  const format = useFormatters()
  const queryClient = useQueryClient()
  const tokens = useQuery({
    ...getIdPersonalTokensQuery(),
    select: (all) => all.filter((token) => token.scopes.includes(SCOPE) && !token.revoked_at),
  })
  const revoke = useMutation({
    mutationFn: (id: string) => deleteIdPersonalToken(id),
    onSuccess: () => {
      toast.success(t("tokenRevoked"))
      return queryClient.invalidateQueries({ queryKey: getIdPersonalTokensQuery().queryKey })
    },
    onError: () => toast.error(t("tokenRevokeFailed")),
  })
  if (!tokens.data?.length) return <p className="text-muted-foreground text-sm">{t("tokenNone")}</p>
  return (
    <ul className="flex flex-col gap-2">
      {tokens.data.map((token) => (
        <li key={token.id} className="flex items-center justify-between gap-3 rounded-card border p-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{token.name}</p>
            <p className="text-muted-foreground text-xs">
              {token.prefix}… ·{" "}
              {t("tokenExpires", { date: format.date(token.expires_at, { day: "numeric", month: "short" }) })}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 md:size-8"
            aria-label={t("tokenRevoke", { name: token.name })}
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

function TokenCreate() {
  const t = useT("catalogFacts")
  const tc = useT("idCommon")
  const queryClient = useQueryClient()
  const nameId = useId()
  const codeId = useId()
  const [name, setName] = useState("")
  const [days, setDays] = useState<(typeof DAYS)[number]>(30)
  const [code, setCode] = useState("")
  const [created, setCreated] = useState<PersonalTokenCreated | null>(null)
  const [codeInvalid, setCodeInvalid] = useState(false)
  const create = useMutation({
    mutationFn: () => createCatalogToken({ name: name.trim(), expires_in_days: days, otp_code: code }),
    onSuccess: (result) => {
      setCreated(result)
      setName("")
      setCode("")
      void queryClient.invalidateQueries({ queryKey: getIdPersonalTokensQuery().queryKey })
    },
    onError: (error) => {
      if (error instanceof OtpInvalidError) {
        setCodeInvalid(true)
        return
      }
      toast.error(t("tokenCreateFailed"))
    },
  })
  const sendCode = useMutation({
    mutationFn: () => postStepUp(),
    onError: () => toast.error(t("tokenCodeFailed")),
  })

  if (created) {
    return (
      <div className="flex flex-col gap-2" data-testid="catalog-token-created">
        <p className="text-sm font-medium">{t("tokenShownOnce")}</p>
        <code className="bg-muted rounded-md p-2 text-xs break-all">{created.token}</code>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton value={created.token} label={t("tokenCopy")} />
          <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={() => setCreated(null)}>
            {t("tokenDone")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim() && code.length === 6) create.mutate()
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={nameId}>{t("tokenName")}</Label>
        <Input id={nameId} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 text-sm font-medium">{t("tokenExpiry")}</legend>
        {DAYS.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={days === option ? "default" : "outline"}
            aria-pressed={days === option}
            onClick={() => setDays(option)}
          >
            {t("tokenDays", { days: option })}
          </Button>
        ))}
      </fieldset>
      <div className="flex flex-col gap-1">
        <Label htmlFor={codeId}>{tc("code")}</Label>
        <div className="flex gap-2">
          <Input
            id={codeId}
            aria-invalid={codeInvalid}
            aria-describedby={codeInvalid ? `${codeId}-error` : undefined}
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            onChange={(event) => {
              setCodeInvalid(false)
              setCode(event.target.value.replace(/\D/g, ""))
            }}
          />
          <Button type="button" variant="outline" disabled={sendCode.isPending} onClick={() => sendCode.mutate()}>
            {sendCode.isSuccess ? tc("stepUp.sendAgain") : tc("stepUp.send")}
          </Button>
        </div>
        {sendCode.isSuccess ? <p className="text-muted-foreground text-sm">{tc("stepUp.sent")}</p> : null}
        {codeInvalid ? (
          <p id={`${codeId}-error`} role="alert" className="text-destructive text-sm">
            {t("tokenCodeWrong")}
          </p>
        ) : null}
      </div>
      <Button type="submit" className="self-start" disabled={!name.trim() || code.length !== 6 || create.isPending}>
        {t("tokenCreate")}
      </Button>
    </form>
  )
}

/** A personal token with the `admission:catalog` scope for an external agent: reads the catalog and proposes, never approves. */
export function CatalogTokenCard() {
  const t = useT("catalogFacts")
  return (
    <section aria-label={t("tokenTitle")} className="bg-card flex flex-col gap-3 rounded-card border p-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">{t("tokenTitle")}</h2>
        <p className="text-muted-foreground text-[13px]">{t("tokenHelp")}</p>
      </div>
      <TokenCreate />
      <TokenList />
    </section>
  )
}
