"use client"

import { FlowCard } from "@/features/shared/components/flow-card"
import { FlowShell } from "@/features/shared/components/flow-shell"
import { LinkButton } from "@/features/shared/components/link-button"
import { useTr } from "@/features/shared/hooks/use-tr"

export default function NotFound() {
  const t = useTr()
  return (
    <FlowShell>
      <FlowCard title={t("common.notFoundTitle")} description={t("common.notFoundDescription")}>
        <LinkButton href="/security/">{t("common.goHome")}</LinkButton>
      </FlowCard>
    </FlowShell>
  )
}
