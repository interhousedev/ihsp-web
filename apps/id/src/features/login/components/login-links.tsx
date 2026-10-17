"use client"

import { useId, useState } from "react"
import { useTr } from "../../shared/hooks/use-tr"
import { TextLink } from "../../shared/components/text-link"

/**
 * Secondary links under the login form: behind one "Can't get in?" button the recovery links (password, login,
 * reclaim), so the form is not followed by several actions at once. Registration sits at the top of the card.
 */
export function LoginLinks() {
  const t = useTr()
  const [helpOpen, setHelpOpen] = useState(false)
  const helpId = useId()
  return (
    <nav aria-label={t("login.helpLinks")} className="flex flex-col">
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
