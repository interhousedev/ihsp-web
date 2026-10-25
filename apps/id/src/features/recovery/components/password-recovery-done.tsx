"use client"

import { Button } from "@ihsp/ui"
import { InfoAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"
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
