"use client"

import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

/** The account is back; the user logs in with the new password. */
export function ReclaimDone() {
  const t = useTr()
  return (
    <FlowCard title={t("reclaim.done.title")} description={t("reclaim.done.description")}>
      <LinkButton href="/security/">{t("reclaim.done.login")}</LinkButton>
    </FlowCard>
  )
}
