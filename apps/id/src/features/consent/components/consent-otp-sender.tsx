"use client"

import { postConsentOtp } from "@ihsp/api"
import { LoadingButton } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

/**
 * **Send code** of an Administration consent: `POST /v1/id/consent/otp` names the user through the consent challenge,
 * so it works without a session of this app (the consent page opens from a Hydra redirect).
 */
export function ConsentOtpSender({ challenge }: { challenge: string }) {
  const t = useTr()
  const mutation = useMutation({ mutationFn: () => postConsentOtp({ consent_challenge: challenge }) })
  return (
    <div className="grid gap-2">
      <LoadingButton
        type="button"
        variant="outline"
        className="h-11"
        loading={mutation.isPending}
        loadingLabel={t("idCommon.working")}
        onClick={() => mutation.mutate()}
      >
        {mutation.isSuccess ? t("idCommon.stepUp.sendAgain") : t("idCommon.stepUp.send")}
      </LoadingButton>
      {mutation.isSuccess ? <p className="text-muted-foreground text-sm">{t("idCommon.stepUp.sent")}</p> : null}
      <ErrorAlert error={mutation.error} />
    </div>
  )
}
