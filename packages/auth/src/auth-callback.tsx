"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, StateView } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FullScreenSpinner } from "./full-screen-spinner"
import { handleCallback, login } from "./session"

/**
 * The page behind `/auth/callback/` (every app renders it as its `auth/callback/page.tsx`): one calm spinner while the
 * code is exchanged (exactly once, also in strict mode), then the history entry of the callback is replaced by the
 * page the user came from. A failure explains itself and offers a new login.
 */
export function AuthCallback() {
  const t = useT()
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let active = true
    handleCallback().then(
      (returnTo) => {
        if (active) router.replace(returnTo)
      },
      (cause: unknown) => {
        if (active) setError(cause)
      },
    )
    return () => {
      active = false
    }
  }, [router])

  if (error === null) return <FullScreenSpinner text={t("auth.signingIn")} />

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <StateView
        state="error"
        className="border-0"
        title={t("auth.callbackFailed")}
        description={isApiError(error) ? errorMessage(error) : t("errors.generic")}
        action={
          <Button className="min-h-11" onClick={() => void login("/", { manual: true })}>
            {t("auth.tryAgain")}
          </Button>
        }
      />
    </main>
  )
}
