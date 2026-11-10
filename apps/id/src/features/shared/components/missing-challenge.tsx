"use client"

import { LinkButton, useTr } from "@ihsp/features-core/id-account"
import { FlowCard } from "./flow-card"

/** Shown when a Hydra page (`/login/`, `/consent/`, `/logout/`) is opened without its challenge. */
export function MissingChallenge() {
  const t = useTr()
  return (
    <FlowCard title={t("idCommon.missingChallenge.title")} description={t("idCommon.missingChallenge.description")}>
      <LinkButton href="/security/">{t("idCommon.missingChallenge.action")}</LinkButton>
    </FlowCard>
  )
}
