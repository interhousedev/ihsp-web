"use client"

import { useTr } from "../../shared/hooks/use-tr"
import { TextLink } from "../../shared/components/text-link"
import { withChallenge } from "../../shared/utils/challenge"

/** Secondary links under the login form (recovery, registration, reclaim). */
export function LoginLinks({ challenge }: { challenge: string }) {
  const t = useTr()
  return (
    <nav aria-label={t("login.helpLinks")} className="flex flex-col">
      <TextLink href="/recovery/password/">{t("login.forgotPassword")}</TextLink>
      <TextLink href="/recovery/login/">{t("login.forgotLogin")}</TextLink>
      <TextLink href={withChallenge("/register/", "login_challenge", challenge)}>{t("login.register")}</TextLink>
      <TextLink href="/reclaim/">{t("login.cantGetIn")}</TextLink>
    </nav>
  )
}
