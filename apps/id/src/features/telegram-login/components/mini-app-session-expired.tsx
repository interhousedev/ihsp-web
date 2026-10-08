"use client"

import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"

/** UF-BOT-01 3b: `initData` is invalid or older than 24 hours. */
export function MiniAppSessionExpired() {
  const t = useTr()
  return <FlowCard title={t("miniApp.expired.title")} description={t("miniApp.expired.description")} />
}
