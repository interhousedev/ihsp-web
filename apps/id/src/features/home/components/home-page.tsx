"use client"

import { login, useSession, useSilentSignIn } from "@ihsp/auth"
import { Button } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { LinkButton, useTr } from "@ihsp/features-core/id-account"
import { FlowCard } from "../../shared/components/flow-card"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { redirectTo } from "../../shared/utils/redirect"

/** `/` with the query string (Hydra's `login_challenge` and anything else) carried over to the next page. */
function withQuery(path: string, query: string): string {
  return query ? `${path}?${query}` : path
}

/** Picks up a sign-in made anywhere on the platform, so a signed-in user never sees the anonymous page. */
function SilentSignIn() {
  useSilentSignIn({ always: true })
  return null
}

/**
 * `/`: the entry of the login app. A signed-in user goes on to the account; everyone else picks between logging in
 * and registering with EMIS. Both buttons keep the query string, so a Hydra login started here still completes.
 */
export function HomePage() {
  const t = useTr()
  const { status } = useSession()
  const params = useSearchParams()
  const query = params.toString()
  const hasChallenge = Boolean(params.get("login_challenge"))
  const authenticated = status === "authenticated"

  useEffect(() => {
    if (authenticated) redirectTo("/security/")
  }, [authenticated])

  if (authenticated || status === "loading") return <FlowSkeleton />
  return (
    <FlowCard title={t("home.title")}>
      {hasChallenge ? null : <SilentSignIn />}
      {hasChallenge ? (
        <LinkButton href={withQuery("/login/", query)}>{t("home.haveAccount")}</LinkButton>
      ) : (
        // Without a challenge the OAuth (PKCE) login starts here and comes back to /login/ with one.
        <Button className="h-11 px-4 text-base" onClick={() => void login("/security/", { manual: true })}>
          {t("home.haveAccount")}
        </Button>
      )}
      <LinkButton href={withQuery("/register/", query)} variant="outline">
        {t("home.register")}
      </LinkButton>
    </FlowCard>
  )
}
