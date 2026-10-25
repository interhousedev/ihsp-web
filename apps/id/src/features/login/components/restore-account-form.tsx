"use client"

import { isApiError, postLoginRestore, postLoginRestoreDecline } from "@ihsp/api"
import { Button, LoadingButton } from "@ihsp/ui"
import { useFormatters } from "@ihsp/i18n"
import { useMutation } from "@tanstack/react-query"
import { ErrorAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed } from "../../shared/utils/challenge"
import { redirectTo } from "../../shared/utils/redirect"
import { applyLoginResult, type AccountRestore } from "../utils/login-result"

type RestoreAccountFormProps = { challenge: string; restore: AccountRestore; onExpired: () => void }

/** ID-29: the login of an account scheduled for deletion. Restore cancels the deletion and continues the login. */
export function RestoreAccountForm({ challenge, restore, onExpired }: RestoreAccountFormProps) {
  const t = useTr()
  const format = useFormatters()
  const body = { login_challenge: challenge, ticket: restore.ticket }
  const onError = (error: Error) => {
    if (followChallengeUsed(error)) return
    if (isApiError(error) && error.status === 401) onExpired()
  }
  const restoreMutation = useMutation({
    mutationFn: () => postLoginRestore(body),
    onSuccess: (result) => applyLoginResult(result, () => undefined),
    onError,
  })
  const declineMutation = useMutation({
    mutationFn: () => postLoginRestoreDecline(body),
    onSuccess: (result) => redirectTo(result.redirect_to),
    onError,
  })
  const busy = restoreMutation.isPending || declineMutation.isPending

  return (
    <FlowCard
      title={t("login.restore.title")}
      description={t("login.restore.description", { date: format.date(restore.deletes_on) })}
    >
      <ErrorAlert error={restoreMutation.error ?? declineMutation.error} />
      <LoadingButton
        type="button"
        className="h-11 text-base"
        loading={restoreMutation.isPending}
        loadingLabel={t("idCommon.working")}
        disabled={busy}
        onClick={() => restoreMutation.mutate()}
      >
        {t("login.restore.restore")}
      </LoadingButton>
      <Button type="button" variant="ghost" className="h-11" disabled={busy} onClick={() => declineMutation.mutate()}>
        {t("login.restore.decline")}
      </Button>
    </FlowCard>
  )
}
