"use client"

import { InfoAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

/** The password was changed; every other session was revoked. */
export function PasswordRecoveryDone() {
  const t = useTr()
  return (
    <FlowCard title={t("recovery.password.doneTitle")} description={t("recovery.password.doneDescription")}>
      <InfoAlert>{t("recovery.password.sessionsRevoked")}</InfoAlert>
      <LinkButton href="/security/">{t("recovery.password.login")}</LinkButton>
    </FlowCard>
  )
}
