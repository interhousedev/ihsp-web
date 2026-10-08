"use client"

import { postStepUp } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { LoadingButton } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useTr } from "../hooks/use-tr"
import { ErrorAlert } from "./error-alert"

/**
 * **Send code**: `POST /v1/id/me/step-up` mails or messages an OTP to the user's channels. It needs a signed-in session
 * of this app, so a visitor without one gets a hint instead of a button (the call would start a login redirect).
 */
export function StepUpSender() {
  const t = useTr()
  const { status } = useSession()
  const mutation = useMutation({ mutationFn: () => postStepUp() })

  if (status !== "authenticated") {
    return (
      <p className="text-muted-foreground text-sm">
        {t("idCommon.stepUp.needSession")}{" "}
        <a href="/security/" target="_blank" rel="noreferrer" className="underline underline-offset-4">
          {t("idCommon.stepUp.openSecurity")}
        </a>
      </p>
    )
  }
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
