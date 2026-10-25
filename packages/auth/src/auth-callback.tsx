"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Icons } from "@ihsp/ui"
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
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icons.alertCircle aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{t("auth.callbackFailed")}</EmptyTitle>
          <EmptyDescription>{isApiError(error) ? errorMessage(error) : t("errors.generic")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button className="min-h-11" onClick={() => void login("/", { manual: true })}>
            {t("auth.tryAgain")}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
