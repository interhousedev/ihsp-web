"use client"

import { setLocale } from "@ihsp/i18n"
import { useEffect } from "react"
import { MissingChallenge } from "../../shared/components/missing-challenge"
import { useQueryParam } from "../../shared/hooks/use-query-param"
import { LoginFlow } from "./login-flow"
import { localeOfUiLocales } from "../utils/ui-locales"

/**
 * `/login/?login_challenge=`: Hydra's login page. An OIDC `ui_locales` parameter (a space-separated list, the first
 * supported language wins), when the request carries it, sets the page language, so a sign-in started by an app in
 * Russian does not open in English.
 */
export function LoginPage() {
  const challenge = useQueryParam("login_challenge")
  const uiLocale = localeOfUiLocales(useQueryParam("ui_locales"))
  useEffect(() => {
    if (uiLocale) setLocale(uiLocale)
  }, [uiLocale])
  if (!challenge) return <MissingChallenge />
  return <LoginFlow challenge={challenge} />
}
