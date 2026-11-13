"use client"

import { postIdPersonalTokens, type PersonalTokenCreated, type PersonalTokenScope } from "@ihsp/api"
import { Button, Card, CardContent, CardHeader, CardTitle, Dropdown, FieldLabel, LoadingButton } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useId, useState } from "react"
import { CheckboxRow } from "../../shared/components/checkbox-row"
import { CodeInput } from "../../shared/components/code-input"
import { ErrorAlert } from "../../shared/components/error-alert"
import { DocsLink } from "../../shared/components/docs-link"
import { StepUpSender } from "../../shared/components/step-up-sender"
import { TextField } from "../../shared/components/text-field"
import { useClientConfig } from "../../shared/hooks/use-client-config"
import { useTr } from "../../shared/hooks/use-tr"

const SCOPES: PersonalTokenScope[] = ["me:read", "me:write"]
const EXPIRY_DAYS = [30, 90, 365] as const

type NewPersonalTokenFormProps = {
  onCreated: (created: PersonalTokenCreated) => void
  onCancel: () => void
}

/** Name, scopes, expiry and an OTP step-up check; the token itself comes back once in the response. */
export function NewPersonalTokenForm({ onCreated, onCancel }: NewPersonalTokenFormProps) {
  const t = useTr()
  const docsUrl = useClientConfig()?.docs.personal_tokens_url
  const expiryId = useId()
  const [name, setName] = useState("")
  const [scopes, setScopes] = useState<PersonalTokenScope[]>(["me:read"])
  const [days, setDays] = useState<(typeof EXPIRY_DAYS)[number]>(30)
  const [code, setCode] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const mutation = useMutation({
    mutationFn: () => postIdPersonalTokens({ name: name.trim(), scopes, expires_in_days: days, otp_code: code }),
    onSuccess: onCreated,
  })

  function toggle(scope: PersonalTokenScope, checked: boolean) {
    setScopes(checked ? [...scopes, scope] : scopes.filter((item) => item !== scope))
  }

  const nameError = showErrors && name.trim() === "" ? t("idCommon.validation.required") : null
  const codeMissing = code.length !== 6

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("personalTokens.new.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            setShowErrors(true)
            if (name.trim() === "" || scopes.length === 0 || codeMissing) return
            mutation.mutate()
          }}
        >
          <TextField
            label={t("personalTokens.new.name")}
            value={name}
            onValueChange={setName}
            error={nameError}
            maxLength={60}
            autoComplete="off"
          />
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">{t("personalTokens.scopes")}</legend>
            {SCOPES.map((scope) => (
              <CheckboxRow
                key={scope}
                checked={scopes.includes(scope)}
                onCheckedChange={(checked) => toggle(scope, checked)}
                ariaLabel={scope}
              >
                <code className="text-sm">{scope}</code>
                <span className="text-muted-foreground text-sm">
                  {t(scope === "me:read" ? "personalTokens.new.scopeRead" : "personalTokens.new.scopeWrite")}
                </span>
              </CheckboxRow>
            ))}
            {showErrors && scopes.length === 0 ? (
              <p role="alert" className="text-destructive text-sm">
                {t("personalTokens.new.scopesRequired")}
              </p>
            ) : null}
          </fieldset>
          <div className="grid gap-2">
            <FieldLabel htmlFor={expiryId}>{t("personalTokens.new.expiry")}</FieldLabel>
            <Dropdown
              id={expiryId}
              className="w-full"
              value={String(days)}
              onValueChange={(next) => setDays(Number(next) as (typeof EXPIRY_DAYS)[number])}
              options={EXPIRY_DAYS.map((option) => ({
                value: String(option),
                label: t("personalTokens.new.days", { count: option }),
              }))}
            />
          </div>
          <div className="grid gap-3">
            <p className="text-muted-foreground text-sm">{t("personalTokens.new.otp")}</p>
            <CodeInput value={code} onChange={setCode} label={t("idCommon.code")} />
            <StepUpSender />
            {showErrors && codeMissing ? (
              <p role="alert" className="text-destructive text-sm">
                {t("idCommon.validation.code")}
              </p>
            ) : null}
          </div>
          <ErrorAlert error={mutation.error} />
          <DocsLink href={docsUrl}>{t("personalTokens.docs")}</DocsLink>
          <div className="flex flex-wrap gap-2">
            <LoadingButton
              type="submit"
              className="h-11 text-base"
              loading={mutation.isPending}
              loadingLabel={t("idCommon.working")}
            >
              {t("personalTokens.new.submit")}
            </LoadingButton>
            <Button type="button" variant="outline" className="h-11 text-base" onClick={onCancel}>
              {t("personalTokens.new.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
