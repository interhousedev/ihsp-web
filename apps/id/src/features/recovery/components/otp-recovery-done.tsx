"use client"

import { useFormatters } from "@ihsp/i18n"
import { InfoAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

/** The reset is scheduled: it takes effect at `effectiveAt` (24 hours later) unless a linked account cancels it. */
export function OtpRecoveryDone({ effectiveAt }: { effectiveAt: string }) {
  const t = useTr()
  const format = useFormatters()
  return (
    <FlowCard
      title={t("recovery.otp.doneTitle")}
      description={t("recovery.otp.doneDescription", { when: format.dateTime(effectiveAt) })}
    >
      <InfoAlert>{t("recovery.otp.cancelHint")}</InfoAlert>
      <LinkButton href="/security/" variant="outline">
        {t("recovery.backToLogin")}
      </LinkButton>
    </FlowCard>
  )
}
