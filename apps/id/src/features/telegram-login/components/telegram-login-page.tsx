"use client"

import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { useInitData } from "../../shared/hooks/use-init-data"
import { MiniAppLogin } from "./mini-app-login"
import { OutsideTelegram } from "./outside-telegram"

/** `/telegram/`: the login page of the bot's mini app (UF-BOT-01). It only works with signed `initData` (ID-20). */
export function TelegramLoginPage() {
  const initData = useInitData()
  if (initData === undefined) return <FlowSkeleton />
  if (!initData) return <OutsideTelegram />
  return <MiniAppLogin initData={initData} />
}
