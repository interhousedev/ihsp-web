"use client"

import { CopyButton } from "@ihsp/ui"
import { useTr } from "@ihsp/features-core/id-account"

/** The new login, highlighted, with a copy button and how to sign in with it. */
export function LoginNameCard({ login }: { login: string }) {
  const t = useTr()

  return (
    <section
      aria-label={t("register.loginCard.title")}
      className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4"
    >
      <p className="text-sm font-medium text-muted-foreground">{t("register.loginCard.title")}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <code className="font-mono text-xl font-semibold break-all text-foreground">{login}</code>
        <CopyButton value={login} label={t("register.loginCard.copy")} size="sm" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("register.loginCard.hint")}</p>
    </section>
  )
}
