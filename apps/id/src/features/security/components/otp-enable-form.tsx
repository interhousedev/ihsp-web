"use client"

import { postOtpEnable, postOtpEnableConfirm, type UserMe } from "@ihsp/api"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingButton,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { CheckboxRow } from "../../shared/components/checkbox-row"
import { CodeStep } from "../../shared/components/code-step"
import { ErrorAlert } from "../../shared/components/error-alert"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

type OtpEnableFormProps = { user: UserMe; onEnabled: (user: UserMe) => void }

/** UF-ID-06 steps 1-4: pick the channels, get a test code, enter it. */
export function OtpEnableForm({ user, onEnabled }: OtpEnableFormProps) {
  const t = useTr()
  const [viaEmail, setViaEmail] = useState(Boolean(user.recovery_email) && user.telegram.length === 0)
  const [sent, setSent] = useState(false)
  const telegramChannels = user.telegram.filter((account) => account.otp_delivery)
  const hasChannel = viaEmail || telegramChannels.length > 0

  const start = useMutation({
    mutationFn: () => postOtpEnable({ via_email: viaEmail }),
    onSuccess: () => setSent(true),
  })
  const confirm = useMutation({ mutationFn: (code: string) => postOtpEnableConfirm({ code }), onSuccess: onEnabled })

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("security.otp.confirmTitle")}</CardTitle>
          <CardDescription>{t("security.otp.confirmDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <CodeStep
            submitLabel={t("security.otp.confirm")}
            pending={confirm.isPending}
            error={confirm.error ?? start.error}
            onSubmit={(code) => confirm.mutate(code)}
            onResend={() => start.mutate()}
            resendPending={start.isPending}
          />
          <Button type="button" variant="ghost" className="h-11" onClick={() => setSent(false)}>
            {t("security.otp.changeChannels")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.otp.enableTitle")}</CardTitle>
        <CardDescription>{t("security.otp.enableDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">{t("security.otp.channels")}</legend>
          <div className="flex min-h-11 items-start gap-3 rounded-lg border p-3">
            <div className="grid gap-1">
              <span className="text-sm font-medium">{t("security.otp.telegramChannel")}</span>
              {telegramChannels.length > 0 ? (
                <span className="text-muted-foreground text-sm">
                  {telegramChannels
                    .map((account) => (account.username ? `@${account.username}` : account.telegram_user_id))
                    .join(", ")}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">{t("security.otp.noTelegram")}</span>
              )}
              {telegramChannels.length === 0 ? (
                <LinkButton href="/security/telegram/" variant="outline">
                  {t("security.otp.linkTelegram")}
                </LinkButton>
              ) : null}
            </div>
          </div>
          <CheckboxRow
            ariaLabel={t("security.otp.emailChannel")}
            checked={viaEmail}
            disabled={!user.recovery_email}
            onCheckedChange={setViaEmail}
          >
            <span className="text-sm font-medium">{t("security.otp.emailChannel")}</span>
            <span className="text-muted-foreground text-sm">
              {user.recovery_email ?? t("security.cards.emailMissing")}
            </span>
          </CheckboxRow>
        </fieldset>
        {hasChannel ? null : (
          <Alert>
            <AlertDescription>{t("security.otp.needChannel")}</AlertDescription>
          </Alert>
        )}
        <ErrorAlert error={start.error} />
        <LoadingButton
          type="button"
          className="h-11 text-base"
          disabled={!hasChannel}
          loading={start.isPending}
          loadingLabel={t("idCommon.working")}
          onClick={() => start.mutate()}
        >
          {t("security.otp.sendTestCode")}
        </LoadingButton>
      </CardContent>
    </Card>
  )
}
