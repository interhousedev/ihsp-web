"use client"

import { login } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"

/** For a guest: starts the PKCE login and comes back to the same page. */
export function SignInButton({ className = "min-h-11" }: { className?: string }) {
  const t = useT("guest")
  const [busy, setBusy] = useState(false)
  return (
    <Button
      className={className}
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
