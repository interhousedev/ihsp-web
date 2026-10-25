"use client"

import {
  deleteIdMePasskey,
  getIdMeSecurityQuery,
  keys,
  patchIdMePasskey,
  postIdMePasskey,
  postIdMePasskeyOptions,
  postIdMePasswordLoginDisable,
  type Passkey,
  type SecurityFactors,
} from "@ihsp/api"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  IconFingerprint,
  Input,
  LoadingButton,
  PageContainer,
} from "@ihsp/ui"
import { useFormatters } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { createPasskey, isPasskeyCancel, passkeysSupported } from "../../shared/utils/webauthn"

/** A default name from the device, e.g. "Mac" or "iPhone". */
function deviceName(): string {
  const agent = typeof navigator === "undefined" ? "" : navigator.userAgent
  for (const name of ["iPhone", "iPad", "Android", "Mac", "Windows", "Linux"]) {
    if (agent.includes(name === "Mac" ? "Macintosh" : name)) return name
  }
  return "Passkey"
}

/** `/security/passkeys/`: add, rename and remove passkeys; turn password sign-in off. */
export function PasskeysPage() {
  const t = useTr()
  const security = useQuery(getIdMeSecurityQuery())
  return (
    <PageContainer title={t("security.passkeys.title")}>
      <QueryBoundary query={security}>
        {(factors) => (
          <div className="grid gap-4">
            <AddPasskeyCard />
            {factors.passkeys.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("security.passkeys.empty")}</p>
            ) : (
              <ul className="grid gap-3" aria-label={t("security.passkeys.title")}>
                {factors.passkeys.map((passkey) => (
                  <PasskeyRow key={passkey.id} passkey={passkey} />
                ))}
              </ul>
            )}
            <PasswordLoginCard factors={factors} />
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}

function useRefreshSecurity() {
  const queryClient = useQueryClient()
  return {
    invalidate: () => void queryClient.invalidateQueries({ queryKey: keys.id.security() }),
    set: (factors: SecurityFactors) => queryClient.setQueryData(keys.id.security(), factors),
  }
}

function AddPasskeyCard() {
  const t = useTr()
  const refresh = useRefreshSecurity()
  const add = useMutation({
    mutationFn: async () => {
      const { options } = await postIdMePasskeyOptions()
      const credential = await createPasskey(options)
      if (!credential) return null
      return postIdMePasskey({ credential, name: deviceName() })
    },
    onSuccess: refresh.invalidate,
  })
  const supported = passkeysSupported()
  const error = add.error && !isPasskeyCancel(add.error) ? add.error : null
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.passkeys.addTitle")}</CardTitle>
        <CardDescription>{t("security.passkeys.addDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {supported ? null : (
          <Alert>
            <AlertDescription>{t("security.passkeys.unsupported")}</AlertDescription>
          </Alert>
        )}
        <ErrorAlert error={error} />
        <LoadingButton
          className="h-11 text-base"
          disabled={!supported}
          loading={add.isPending}
          loadingLabel={t("idCommon.working")}
          onClick={() => add.mutate()}
        >
          <IconFingerprint className="size-5" aria-hidden />
          {t("security.passkeys.add")}
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

function PasskeyRow({ passkey }: { passkey: Passkey }) {
  const t = useTr()
  const format = useFormatters()
  const refresh = useRefreshSecurity()
  const [name, setName] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const rename = useMutation({
    mutationFn: (value: string) => patchIdMePasskey(passkey.id, { name: value }),
    onSuccess: () => {
      setName(null)
      refresh.invalidate()
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteIdMePasskey(passkey.id),
    onSuccess: () => {
      setConfirming(false)
      refresh.invalidate()
    },
  })

  return (
    <li>
      <Card>
        <CardContent className="grid gap-3 pt-6">
          {name === null ? (
            <div className="flex flex-wrap items-center gap-2">
              <IconFingerprint className="text-muted-foreground size-5" aria-hidden />
              <span className="min-w-0 flex-1 font-medium break-words">{passkey.name}</span>
              <Button variant="outline" className="h-11" onClick={() => setName(passkey.name)}>
                {t("security.passkeys.rename")}
              </Button>
              <Button variant="outline" className="text-destructive h-11" onClick={() => setConfirming(true)}>
                {t("security.passkeys.remove")}
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (name.trim()) rename.mutate(name.trim())
              }}
            >
              <Input
                aria-label={t("security.passkeys.name")}
                value={name}
                maxLength={100}
                autoFocus
                className="h-11 min-w-0 flex-1 text-base"
                onChange={(event) => setName(event.target.value)}
              />
              <LoadingButton
                type="submit"
                className="h-11"
                loading={rename.isPending}
                loadingLabel={t("idCommon.working")}
              >
                {t("security.passkeys.save")}
              </LoadingButton>
              <Button type="button" variant="ghost" className="h-11" onClick={() => setName(null)}>
                {t("security.passkeys.cancel")}
              </Button>
            </form>
          )}
          <p className="text-muted-foreground text-sm">
            {t("security.passkeys.created", { date: format.date(passkey.created_at) })}
            {" · "}
            {passkey.last_used_at
              ? t("security.passkeys.lastUsed", { date: format.date(passkey.last_used_at) })
              : t("security.passkeys.neverUsed")}
          </p>
          <ErrorAlert error={rename.error} />
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("security.passkeys.removeTitle", { name: passkey.name })}
        description={t("security.passkeys.removeDescription")}
        confirmLabel={t("security.passkeys.remove")}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      >
        <ErrorAlert error={remove.error} />
      </ConfirmDialog>
    </li>
  )
}

function PasswordLoginCard({ factors }: { factors: SecurityFactors }) {
  const t = useTr()
  const refresh = useRefreshSecurity()
  const [confirming, setConfirming] = useState(false)
  const disable = useMutation({
    mutationFn: () => postIdMePasswordLoginDisable(),
    onSuccess: (result) => {
      setConfirming(false)
      refresh.set(result)
    },
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.passkeys.passwordTitle")}</CardTitle>
        <CardDescription>
          {factors.password_login_enabled ? t("security.passkeys.passwordOn") : t("security.passkeys.passwordOff")}
        </CardDescription>
      </CardHeader>
      {factors.password_login_enabled ? (
        <CardContent>
          <Button
            variant="outline"
            className="h-11"
            disabled={factors.passkeys.length === 0}
            onClick={() => setConfirming(true)}
          >
            {t("security.passkeys.passwordDisable")}
          </Button>
          <ConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            title={t("security.passkeys.passwordDisableTitle")}
            description={t("security.passkeys.passwordDisableDescription")}
            confirmLabel={t("security.passkeys.passwordDisable")}
            destructive
            loading={disable.isPending}
            onConfirm={() => disable.mutate()}
          >
            <ErrorAlert error={disable.error} />
          </ConfirmDialog>
        </CardContent>
      ) : null}
    </Card>
  )
}
