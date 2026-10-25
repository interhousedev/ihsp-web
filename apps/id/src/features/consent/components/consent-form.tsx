"use client"

import { postConsent, type ConsentInfo, type ScopeCatalog } from "@ihsp/api"
import { Badge, Button, LoadingButton } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { CodeInput } from "../../shared/components/code-input"
import { ErrorAlert, InfoAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed } from "../../shared/utils/challenge"
import { redirectTo } from "../../shared/utils/redirect"
import { toolsForScope } from "../utils/scope-tools"
import { ConsentOtpSender } from "./consent-otp-sender"
import { ScopeCheckbox } from "./scope-checkbox"

const SERVER_KEYS = {
  student: "consent.server.student",
  lms: "consent.server.lms",
  admin: "consent.server.admin",
} as const

type ConsentFormProps = { challenge: string; info: ConsentInfo; catalog: ScopeCatalog | undefined }

/** UF-MCP-02 step 3: who asks, where the answer goes, what it may do; the user can untick scopes. */
export function ConsentForm({ challenge, info, catalog }: ConsentFormProps) {
  const t = useTr()
  const [selected, setSelected] = useState<string[]>(info.requested_scopes)
  const [code, setCode] = useState("")
  const mutation = useMutation({
    mutationFn: (accept: boolean) =>
      postConsent({
        consent_challenge: challenge,
        accept,
        grant_scopes: accept ? selected : [],
        otp_code: accept && info.requires_otp ? code : undefined,
      }),
    onSuccess: (result) => redirectTo(result.redirect_to),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })
  const codeMissing = info.requires_otp && code.length !== 6
  const cannotAllow = selected.length === 0 || codeMissing

  function toggle(scope: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, scope] : current.filter((item) => item !== scope)))
  }

  return (
    <FlowCard title={t("consent.title", { client: info.client_name })} description={t("consent.description")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-medium">{info.client_name}</span>
        {info.verified ? (
          <Badge variant="secondary">{t("consent.verified")}</Badge>
        ) : (
          <Badge variant="destructive">{t("consent.unverified")}</Badge>
        )}
      </div>
      {info.verified ? null : <InfoAlert>{t("consent.unverifiedWarning")}</InfoAlert>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("consent.redirectDomain")}</dt>
        <dd className="font-medium break-all">{info.redirect_domain}</dd>
        {info.server ? (
          <>
            <dt className="text-muted-foreground">{t("consent.serverLabel")}</dt>
            <dd className="font-medium">{t(SERVER_KEYS[info.server])}</dd>
          </>
        ) : null}
      </dl>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">{t("consent.scopes")}</legend>
        {info.requested_scopes.map((scope) => (
          <ScopeCheckbox
            key={scope}
            scope={scope}
            tools={toolsForScope(catalog, info.server, scope)}
            checked={selected.includes(scope)}
            onCheckedChange={(checked) => toggle(scope, checked)}
          />
        ))}
      </fieldset>
      {info.requires_otp ? (
        <div className="grid gap-3">
          <p className="text-muted-foreground text-sm">{t("consent.otpRequired")}</p>
          <CodeInput value={code} onChange={setCode} label={t("idCommon.code")} />
          <ConsentOtpSender challenge={challenge} />
        </div>
      ) : null}
      <ErrorAlert error={mutation.error} />
      <div className="grid gap-2">
        <LoadingButton
          type="button"
          className="h-11 text-base"
          disabled={cannotAllow}
          loading={mutation.isPending && mutation.variables === true}
          loadingLabel={t("idCommon.working")}
          onClick={() => mutation.mutate(true)}
        >
          {t("consent.allow")}
        </LoadingButton>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(false)}
        >
          {t("consent.deny")}
        </Button>
      </div>
    </FlowCard>
  )
}
