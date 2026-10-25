"use client"

import { deleteMe, type UserMe } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  LoadingButton,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { CodeInput } from "../../shared/components/code-input"
import { ErrorAlert } from "../../shared/components/error-alert"
import { StepUpSender } from "../../shared/components/step-up-sender"
import { TextField } from "../../shared/components/text-field"
import { useTr } from "../../shared/hooks/use-tr"

const DELETED_KEYS = [
  "security.delete.items.account",
  "security.delete.items.files",
  "security.delete.items.chats",
  "security.delete.items.flashcards",
  "security.delete.items.links",
  "security.delete.items.mail",
] as const
const KEPT_KEYS = ["security.delete.kept.attendance", "security.delete.kept.marks"] as const

/** What is deleted and kept, then the password (and the OTP) behind a final confirmation dialog. */
export function DeleteAccountForm({ user }: { user: UserMe }) {
  const t = useTr()
  const format = useFormatters()
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [confirming, setConfirming] = useState(false)
  const mutation = useMutation({
    mutationFn: () => deleteMe({ password, otp_code: code || undefined }),
    onSettled: () => setConfirming(false),
  })
  const needsCode = user.otp_enabled
  const ready = password.length > 0 && (!needsCode || code.length === 6)

  if (mutation.isSuccess) {
    return (
      <Alert role="status">
        <AlertTitle>{t("security.delete.doneTitle")}</AlertTitle>
        <AlertDescription>
          {t("security.delete.doneDescription", { date: format.date(mutation.data.closes_on) })}
        </AlertDescription>
      </Alert>
    )
  }
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("security.delete.deletedTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ul className="list-disc pl-5 text-sm">
            {DELETED_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <div className="grid gap-1">
            <p className="text-sm font-medium">{t("security.delete.keptTitle")}</p>
            <ul className="text-muted-foreground list-disc pl-5 text-sm">
              {KEPT_KEYS.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </div>
          <p className="text-muted-foreground text-sm">{t("security.delete.thirtyDays")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("security.delete.confirmTitle")}</CardTitle>
          <CardDescription>{t("security.delete.confirmDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextField
            label={t("security.currentPassword")}
            type="password"
            autoComplete="current-password"
            value={password}
            onValueChange={setPassword}
          />
          {needsCode ? (
            <div className="grid gap-3">
              <CodeInput value={code} onChange={setCode} label={t("idCommon.code")} />
              <StepUpSender />
            </div>
          ) : null}
          <ErrorAlert error={mutation.error} />
          <LoadingButton
            type="button"
            variant="destructive"
            className="h-11 text-base"
            disabled={!ready}
            loading={mutation.isPending}
            loadingLabel={t("idCommon.working")}
            onClick={() => setConfirming(true)}
          >
            {t("security.delete.submit")}
          </LoadingButton>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("security.delete.dialogTitle")}
        description={t("security.delete.dialogDescription")}
        confirmLabel={t("security.delete.submit")}
        destructive
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    </div>
  )
}
