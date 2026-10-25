"use client"

import { getConfig } from "@ihsp/config"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"
import { removeSession, TELEGRAM_INIT_DATA_KEY } from "../../shared/utils/storage"
import { useEffect } from "react"

/** UF-BOT-01 3a: the page opened outside Telegram (no `initData`). */
export function OutsideTelegram() {
  const t = useTr()
  const bot = getConfig().BOT_USERNAME
  // A stale `initData` (a bearer credential while the backend accepts its `auth_date`) has no use outside Telegram.
  useEffect(() => removeSession(TELEGRAM_INIT_DATA_KEY), [])
  return (
    <FlowCard title={t("miniApp.outside.title")} description={t("miniApp.outside.description", { bot })}>
      <LinkButton href={`https://t.me/${bot}`} newTab>
        {t("miniApp.outside.open", { bot })}
      </LinkButton>
    </FlowCard>
  )
}
