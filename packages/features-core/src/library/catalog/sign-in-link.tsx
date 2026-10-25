"use client"

import { login } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"

/**
 * A button that sends a signed-out visitor to the login and back to this page. Used wherever an action needs an
 * account (shelf, report, notebook) so the visitor never meets a dead button.
 */
export function SignInLink({
  label,
  variant = "outline",
  size = "default",
  className,
}: {
  /** Text of the button; defaults to the plain "Sign in". */
  label?: string
  variant?: "outline" | "default" | "secondary" | "ghost"
  size?: "default" | "sm"
  className?: string
}) {
  const t = useT("library.home")
  const [busy, setBusy] = useState(false)
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={busy}
      className={className ?? "min-h-11 md:min-h-8"}
      onClick={() => {
        setBusy(true)
        login(undefined, { manual: true }).catch(() => setBusy(false))
      }}
    >
      <Icons.login aria-hidden />
      {label ?? t("signIn")}
    </Button>
  )
}
