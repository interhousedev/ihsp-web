"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Icons,
  StateView,
} from "@ihsp/ui"
import { useEffect, useState, type ReactNode } from "react"
import { FullScreenSpinner } from "./full-screen-spinner"
import { login, retryBootstrap } from "./session"
import { useAuthStore } from "./store"
import { useSession } from "./use-session"

/**
 * Shows `children` to logged-in users. The session is restored first (the refresh cookie, silently); only an
 * anonymous visitor is sent to the login (PKCE) and comes back to the same page. All the while one spinner with one
 * text is shown, so nothing flashes. When the server cannot be reached it offers a retry; when logins keep coming
 * back unauthorised it stops redirecting and asks the user.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const t = useT()
  const { status } = useSession()
  const networkError = useAuthStore((state) => state.networkError)
  const [stopped, setStopped] = useState(false)

  useEffect(() => {
    if (status !== "anonymous") return
    login().catch(() => setStopped(true))
  }, [status])

  if (status === "authenticated") return <>{children}</>
  if (networkError) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <StateView state="offline" onRetry={() => void retryBootstrap()} />
      </div>
    )
  }
  if (stopped) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icons.alertCircle aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{t("auth.callbackFailed")}</EmptyTitle>
            <EmptyDescription>{t("errors.generic")}</EmptyDescription>
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
  return <FullScreenSpinner text={t("auth.signingIn")} />
}
