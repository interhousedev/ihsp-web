"use client"

import { getConfig } from "@ihsp/config"
import { Button } from "@ihsp/ui"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

const DEFAULT_LIBRARY_URL = "https://lib.ihsu.uz"

/** Shown once, right after the account is created; "Continue" resumes the login (or shows the login name). */
export function RegisterWelcome({ onContinue }: { onContinue: () => void }) {
  const t = useTr()
  const config = getConfig()
  const points = ["account", "codes", "security"] as const

  return (
    <FlowCard title={t("register.welcome.title")} description={t("register.welcome.description")}>
      <ul className="text-muted-foreground grid list-disc gap-2 pl-5 text-sm">
        {points.map((point) => (
          <li key={point}>{t(`register.welcome.points.${point}`)}</li>
        ))}
      </ul>
      <div className="grid gap-2">
        <LinkButton href="/security/telegram/" variant="outline" newTab>
          {t("register.welcome.telegram")}
        </LinkButton>
        <LinkButton href={config.LIBRARY_URL ?? DEFAULT_LIBRARY_URL} variant="outline" newTab>
          {t("register.welcome.library")}
        </LinkButton>
        <LinkButton href={config.LMS_URL} variant="outline" newTab>
          {t("register.welcome.lms")}
        </LinkButton>
      </div>
      <Button type="button" className="h-11 text-base" onClick={onContinue}>
        {t("register.welcome.continue")}
      </Button>
    </FlowCard>
  )
}
