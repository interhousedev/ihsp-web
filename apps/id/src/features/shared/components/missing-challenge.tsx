"use client"

import { useTr } from "../hooks/use-tr"
import { FlowCard } from "./flow-card"
import { LinkButton } from "./link-button"

/** Shown when a Hydra page (`/login/`, `/consent/`, `/logout/`) is opened without its challenge. */
export function MissingChallenge() {
  const t = useTr()
  return (
    <FlowCard title={t("idCommon.missingChallenge.title")} description={t("idCommon.missingChallenge.description")}>
      <LinkButton href="/security/">{t("idCommon.missingChallenge.action")}</LinkButton>
    </FlowCard>
  )
}
