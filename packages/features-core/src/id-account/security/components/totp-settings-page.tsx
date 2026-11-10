"use client"

import {
  getIdMeSecurityQuery,
  keys,
  postIdMeTotpConfirm,
  postIdMeTotpDisable,
  postIdMeTotpSetup,
  type TotpSetup,
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
  CopyButton,
  LoadingButton,
  PageContainer,
  QrCode,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { TotpCodeForm } from "../../shared/components/totp-code-form"
import { useTr } from "../../shared/hooks/use-tr"

/** `/security/totp/`: the authenticator app (Google Authenticator and others) as the second login step. */
export function TotpSettingsPage() {
  const t = useTr()
  const security = useQuery(getIdMeSecurityQuery())
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  return (
    <PageContainer title={t("security.totp.title")}>
      {recoveryCodes ? (
        <RecoveryCodesCard codes={recoveryCodes} onDone={() => setRecoveryCodes(null)} />
      ) : (
        <QueryBoundary query={security}>
          {(factors) =>
            factors.totp_enabled ? (
              <div className="grid gap-4">
                <Alert>
                  <AlertDescription>
                    {t("security.totp.enabled", { count: factors.recovery_codes_left })}
                  </AlertDescription>
                </Alert>
                <TotpDisableCard />
              </div>
            ) : (
              <TotpSetupCard onEnabled={setRecoveryCodes} />
            )
          }
        </QueryBoundary>
      )}
    </PageContainer>
  )
}

function TotpSetupCard({ onEnabled }: { onEnabled: (codes: string[]) => void }) {
  const t = useTr()
  const queryClient = useQueryClient()
  const [setup, setSetup] = useState<TotpSetup | null>(null)
  const start = useMutation({ mutationFn: () => postIdMeTotpSetup(), onSuccess: setSetup })
  const confirm = useMutation({
    mutationFn: (code: string) => postIdMeTotpConfirm({ code }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: keys.id.security() })
      onEnabled(result.recovery_codes)
    },
  })

  if (!setup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("security.totp.enableTitle")}</CardTitle>
          <CardDescription>{t("security.totp.enableDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ErrorAlert error={start.error} />
          <LoadingButton
            className="h-11 text-base"
            loading={start.isPending}
            loadingLabel={t("idCommon.working")}
            onClick={() => start.mutate()}
          >
            {t("security.totp.start")}
          </LoadingButton>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.totp.scanTitle")}</CardTitle>
        <CardDescription>{t("security.totp.scanDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="justify-self-center">
          <QrCode value={setup.otpauth_uri} label={t("security.totp.qrLabel")} />
        </div>
        <div className="grid gap-2">
          <span className="text-muted-foreground text-sm">{t("security.totp.manual")}</span>
          <div className="flex items-center gap-2">
            <code
              className="bg-muted min-w-0 flex-1 rounded-md px-3 py-2 font-mono text-sm break-all"
              data-testid="totp-secret"
            >
              {setup.secret.replace(/(.{4})/g, "$1 ").trim()}
            </code>
            <CopyButton value={setup.secret} />
          </div>
        </div>
        <TotpCodeForm
          submitLabel={t("security.totp.confirm")}
          pending={confirm.isPending}
          error={confirm.error}
          allowRecovery={false}
          onSubmit={(code) => confirm.mutate(code)}
        />
      </CardContent>
    </Card>
  )
}

function RecoveryCodesCard({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const t = useTr()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.totp.recoveryTitle")}</CardTitle>
        <CardDescription>{t("security.totp.recoveryDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul
          className="bg-muted grid grid-cols-2 gap-2 rounded-md p-3 font-mono text-sm"
          aria-label={t("security.totp.recoveryTitle")}
        >
          {codes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <CopyButton value={codes.join("\n")} label={t("security.totp.copyCodes")} />
        <Button className="h-11 text-base" onClick={onDone}>
          {t("security.totp.savedCodes")}
        </Button>
      </CardContent>
    </Card>
  )
}

function TotpDisableCard() {
  const t = useTr()
  const queryClient = useQueryClient()
  const disable = useMutation({
    mutationFn: (code: string) => postIdMeTotpDisable({ code }),
    onSuccess: (factors) => queryClient.setQueryData(keys.id.security(), factors),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.totp.disableTitle")}</CardTitle>
        <CardDescription>{t("security.totp.disableDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <TotpCodeForm
          submitLabel={t("security.totp.disable")}
          pending={disable.isPending}
          error={disable.error}
          destructive
          onSubmit={(code) => disable.mutate(code)}
        />
      </CardContent>
    </Card>
  )
}
