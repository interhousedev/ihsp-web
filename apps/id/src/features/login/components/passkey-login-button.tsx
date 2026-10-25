"use client"

import { postIdLoginPasskey, postIdLoginPasskeyOptions, type LoginResult } from "@ihsp/api"
import { IconFingerprint, LoadingButton } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed } from "../../shared/utils/challenge"
import {
  conditionalMediationSupported,
  getPasskey,
  isPasskeyCancel,
  passkeysSupported,
} from "../../shared/utils/webauthn"

type PasskeyLoginButtonProps = {
  challenge: string
  remember: () => boolean
  onResult: (result: LoginResult) => void
}

/**
 * "Sign in with a passkey". Where the browser supports it, passkeys are also offered in the login field's autofill
 * (conditional UI) as soon as the page opens; the button starts a modal request and aborts the autofill one.
 */
export function PasskeyLoginButton({ challenge, remember, onResult }: PasskeyLoginButtonProps) {
  const t = useTr()
  const conditional = useRef<AbortController | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  async function finish(credential: Record<string, unknown> | null) {
    if (!credential) return null
    return postIdLoginPasskey({ login_challenge: challenge, credential, remember: remember() })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      conditional.current?.abort()
      const { options } = await postIdLoginPasskeyOptions({ login_challenge: challenge })
      return finish(await getPasskey(options))
    },
    onSuccess: (result) => {
      if (result) onResultRef.current(result)
    },
    onError: (error) => {
      followChallengeUsed(error)
    },
  })

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    conditional.current = controller
    void (async () => {
      if (!(await conditionalMediationSupported()) || cancelled) return
      try {
        const { options } = await postIdLoginPasskeyOptions({ login_challenge: challenge })
        const credential = await getPasskey(options, { conditional: true, signal: controller.signal })
        const result = await finish(credential)
        if (result && !cancelled) onResultRef.current(result)
      } catch {
        // Autofill is a convenience: a cancel or failure leaves the password form as it was.
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- one autofill request per challenge
  }, [challenge])

  if (!passkeysSupported()) return null
  const error = mutation.error && !isPasskeyCancel(mutation.error) ? mutation.error : null
  return (
    <div className="grid gap-2">
      <LoadingButton
        type="button"
        variant="outline"
        className="h-11 text-base"
        loading={mutation.isPending}
        loadingLabel={t("idCommon.working")}
        onClick={() => mutation.mutate()}
      >
        <IconFingerprint className="size-5" aria-hidden />
        {t("login.passkey.submit")}
      </LoadingButton>
      <ErrorAlert error={error} />
    </div>
  )
}
