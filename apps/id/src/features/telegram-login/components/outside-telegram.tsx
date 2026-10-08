"use client"

import { getConfig } from "@ihsp/config"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

/** UF-BOT-01 3a: the page opened outside Telegram (no `initData`). */
export function OutsideTelegram() {
  const t = useTr()
  const bot = getConfig().BOT_USERNAME
  return (
    <FlowCard title={t("miniApp.outside.title")} description={t("miniApp.outside.description", { bot })}>
      <LinkButton href={`https://t.me/${bot}`} newTab>
        {t("miniApp.outside.open", { bot })}
      </LinkButton>
    </FlowCard>
  )
}
