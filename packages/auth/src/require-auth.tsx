"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useEffect, type ReactNode } from "react"
import { FullScreenSpinner } from "./full-screen-spinner"
import { login, retryBootstrap } from "./session"
import { useAuthStore } from "./store"
import { useSession } from "./use-session"

/**
 * Shows `children` to logged-in users. While the session is restored it shows a spinner; anonymous visitors are
 * sent to the login (PKCE) and come back to the same page; when the server cannot be reached it offers a retry.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const t = useT()
  const { status } = useSession()
  const networkError = useAuthStore((state) => state.networkError)

  useEffect(() => {
    if (status === "anonymous") void login()
  }, [status])

  if (status === "authenticated") return <>{children}</>
  if (networkError) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <StateView state="offline" onRetry={() => void retryBootstrap()} />
      </div>
    )
  }
  return <FullScreenSpinner text={status === "anonymous" ? t("auth.redirecting") : t("auth.signingIn")} />
}
