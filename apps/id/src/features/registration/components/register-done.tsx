"use client"

import { getConfig } from "@ihsp/config"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

/** The account exists (outside Telegram: inside the Telegram web UI the registration goes on to the mini app login). */
export function RegisterDone({ login }: { login: string }) {
  const t = useTr()

  return (
    <FlowCard title={t("register.done.title")} description={t("register.done.description", { login })}>
      <p className="bg-muted/50 rounded-lg p-3 text-center text-lg font-medium break-all">{login}</p>
      <LinkButton href={getConfig().SP_URL} external>
        {t("register.done.open")}
      </LinkButton>
    </FlowCard>
  )
}
