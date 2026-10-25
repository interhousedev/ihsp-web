"use client"

import { getConfig } from "@ihsp/config"
import { useEffect } from "react"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { redirectTo } from "../../shared/utils/redirect"
import { removeSession, TELEGRAM_INIT_DATA_KEY, TELEGRAM_NEW_LOGIN_KEY } from "../../shared/utils/storage"

/** UF-BOT-01 step 6: this Telegram account is linked (or was already); the user goes straight to my.iht. No screen in between. */
export function MiniAppLinked() {
  useEffect(() => {
    removeSession(TELEGRAM_INIT_DATA_KEY)
    removeSession(TELEGRAM_NEW_LOGIN_KEY)
    redirectTo(getConfig().SP_URL)
  }, [])

  return <FlowSkeleton />
}
