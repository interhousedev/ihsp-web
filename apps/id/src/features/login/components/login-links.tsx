"use client"

import { useId, useState } from "react"
import { useTr } from "../../shared/hooks/use-tr"
import { TextLink } from "../../shared/components/text-link"
import { withChallenge } from "../../shared/utils/challenge"

/**
 * Secondary links under the login form: registration, and behind one "Can't get in?" button the recovery links
 * (password, login, reclaim), so the form is not followed by six actions at once.
 */
export function LoginLinks({ challenge }: { challenge: string }) {
  const t = useTr()
  const [helpOpen, setHelpOpen] = useState(false)
  const helpId = useId()
  return (
    <nav aria-label={t("login.helpLinks")} className="flex flex-col">
      <TextLink href={withChallenge("/register/", "login_challenge", challenge)}>{t("login.register")}</TextLink>
      <button
        type="button"
        aria-expanded={helpOpen}
        aria-controls={helpId}
        onClick={() => setHelpOpen((open) => !open)}
        className="inline-flex min-h-11 items-center self-start text-sm underline underline-offset-4"
      >
        {t("login.help")}
      </button>
      {helpOpen ? (
        <div id={helpId} className="flex flex-col">
          <TextLink href="/recovery/password/">{t("login.forgotPassword")}</TextLink>
          <TextLink href="/recovery/login/">{t("login.forgotLogin")}</TextLink>
          <TextLink href="/reclaim/">{t("login.cantGetIn")}</TextLink>
        </div>
      ) : null}
    </nav>
  )
}
