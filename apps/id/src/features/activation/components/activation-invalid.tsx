"use client"

import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

/** UF-ID-13 2a: the link expired (72 hours) or was used. */
export function ActivationInvalid() {
  const t = useTr()
  return (
    <FlowCard title={t("activate.invalid.title")} description={t("activate.invalid.description")}>
      <LinkButton href="/security/" variant="outline">
        {t("activate.invalid.login")}
      </LinkButton>
    </FlowCard>
  )
}
