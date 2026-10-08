"use client"

import { Button } from "@ihsp/ui"
import { closeMiniApp } from "@ihsp/telegram"
import { useEffect } from "react"
import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"
import { removeSession, TELEGRAM_INIT_DATA_KEY, TELEGRAM_NEW_LOGIN_KEY } from "../../shared/utils/storage"

const CLOSE_DELAY_MS = 1500

/** UF-BOT-01 step 6: this Telegram account is linked; the mini app closes and the bot greets the user. */
export function MiniAppLinked({ login }: { login: string }) {
  const t = useTr()

  useEffect(() => {
    removeSession(TELEGRAM_INIT_DATA_KEY)
    removeSession(TELEGRAM_NEW_LOGIN_KEY)
    const timer = setTimeout(closeMiniApp, CLOSE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <FlowCard title={t("miniApp.linked.title")} description={t("miniApp.linked.description", { login })}>
      <Button type="button" className="h-11 text-base" onClick={closeMiniApp}>
        {t("miniApp.linked.close")}
      </Button>
    </FlowCard>
  )
}
