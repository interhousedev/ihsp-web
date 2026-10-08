"use client"

import { handleCallback, login } from "@ihsp/auth"
import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Icons,
  Spinner,
} from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/** OAuth redirect target (`/auth/callback/`): finishes the login and continues where the user was. */
export default function AuthCallbackPage() {
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

  if (error === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4">
        <Spinner className="size-8" />
        <p className="text-muted-foreground text-sm">{t("auth.signingIn")}</p>
      </main>
    )
  }

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
          <Button className="min-h-11" onClick={() => void login("/")}>
            {t("auth.tryAgain")}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
