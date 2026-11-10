"use client"

import { Button } from "@ihsp/ui"
import { InfoAlert, useTr } from "@ihsp/features-core/id-account"
import { FlowCard } from "../../shared/components/flow-card"
import { signInWithTicket } from "../../shared/utils/login-ticket"

/** The password was changed; every other session was revoked and this device stays signed in. */
export function PasswordRecoveryDone({ ticket }: { ticket: string }) {
  const t = useTr()
  return (
    <FlowCard title={t("recovery.password.doneTitle")} description={t("recovery.password.doneDescription")}>
      <InfoAlert>{t("recovery.password.sessionsRevoked")}</InfoAlert>
      <Button type="button" className="h-11" onClick={() => signInWithTicket(ticket)}>
        {t("recovery.password.continue")}
      </Button>
    </FlowCard>
  )
}
