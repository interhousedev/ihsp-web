"use client"

import { getConfig } from "@ihsp/config"
import { useEffect, useState } from "react"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"
import { readSession, TELEGRAM_INIT_DATA_KEY, TELEGRAM_NEW_LOGIN_KEY, writeSession } from "../../shared/utils/storage"

/** The account exists. A mini app user goes back to `/telegram/` to log in (which links that Telegram account). */
export function RegisterDone({ login }: { login: string }) {
  const t = useTr()
  const [fromMiniApp, setFromMiniApp] = useState(false)

  useEffect(() => {
    const hasInitData = readSession(TELEGRAM_INIT_DATA_KEY) !== null
    if (hasInitData) writeSession(TELEGRAM_NEW_LOGIN_KEY, login)
    setFromMiniApp(hasInitData)
  }, [login])

  return (
    <FlowCard title={t("register.done.title")} description={t("register.done.description", { login })}>
      <p className="bg-muted/50 rounded-lg p-3 text-center text-lg font-medium break-all">{login}</p>
      {fromMiniApp ? (
        <LinkButton href="/telegram/">{t("register.done.backToTelegram")}</LinkButton>
      ) : (
        <LinkButton href={getConfig().SP_URL} external>
          {t("register.done.open")}
        </LinkButton>
      )}
    </FlowCard>
  )
}
