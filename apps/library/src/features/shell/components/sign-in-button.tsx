"use client"

import { login } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"

/** Header button for a signed-out visitor: starts the PKCE login and comes back to the same page. */
export function SignInButton() {
  const t = useT("shell")
  const [busy, setBusy] = useState(false)
  return (
    <Button
      className="min-h-11"
      disabled={busy}
      onClick={() => {
        setBusy(true)
        login(undefined, { manual: true }).catch(() => setBusy(false))
      }}
    >
      <Icons.login aria-hidden />
      {t("signIn")}
    </Button>
  )
}
