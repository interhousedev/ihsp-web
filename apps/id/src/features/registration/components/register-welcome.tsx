"use client"

import { getConfig } from "@ihsp/config"
import { Button, IconBrandTelegram, IconShieldCheck, IconUserCheck } from "@ihsp/ui"
import { FlowCard } from "../../shared/components/flow-card"
import { LoginNameCard } from "./login-name-card"
import { LinkButton, useTr } from "@ihsp/features-core/id-account"

const POINT_ICONS = { account: IconUserCheck, codes: IconBrandTelegram, security: IconShieldCheck }
const DEFAULT_LIBRARY_URL = "https://lib.ihsu.uz"

/** Shown once, right after the account is created; "Continue" resumes the login (or shows the login name). */
export function RegisterWelcome({ login, onContinue }: { login: string; onContinue: () => void }) {
  const t = useTr()
  const config = getConfig()
  const points = ["account", "codes", "security"] as const

  return (
    <FlowCard title={t("register.welcome.title")} description={t("register.welcome.description")}>
      <LoginNameCard login={login} />
      <ul className="text-muted-foreground grid gap-3 text-sm">
        {points.map((point) => {
          const Icon = POINT_ICONS[point]
          return (
            <li key={point} className="flex items-start gap-3">
              <Icon aria-hidden className="text-primary mt-0.5 size-5 shrink-0" />
              {t(`register.welcome.points.${point}`)}
            </li>
          )
        })}
      </ul>
      <div className="grid gap-2">
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
