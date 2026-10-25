"use client"

import { useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { TodayCard } from "./today-card"

type StepId = "telegram" | "notifications"

/**
 * The Get started card of a first visit (UF-STF-01): link Telegram to get lesson prompts, check the notification
 * settings. A step can be dismissed (`onboarding_dismissed`); the card goes away when no step is left.
 */
export function GetStartedCard() {
  const t = useT("today.getStarted")
  const { session } = useSession()
  const preferences = usePreferences()
  const update = useUpdatePreferences()

  if (!session || !preferences) return null

  const dismissed = preferences.onboarding_dismissed
  const steps: { id: StepId; done: boolean; href: string }[] = [
    { id: "telegram", done: session.user.telegram.length > 0, href: `${getConfig().ID_URL}/security/telegram/` },
    { id: "notifications", done: false, href: "/settings/" },
  ]
  const open = steps.filter((step) => !step.done && !dismissed.includes(step.id))
  if (open.length === 0) return null

  function dismiss(ids: StepId[]) {
    update.mutate({ onboarding_dismissed: [...new Set([...dismissed, ...ids])] })
  }

  return (
    <TodayCard
      title={t("title")}
      action={
        <Button variant="ghost" className="min-h-11 md:min-h-8" onClick={() => dismiss(open.map((step) => step.id))}>
          {t("hide")}
        </Button>
      }
    >
      <ol className="flex flex-col gap-2">
        {steps.map((step) => {
          const finished = step.done || dismissed.includes(step.id)
          return (
            <li key={step.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-2">
              {finished ? (
                <Icons.circleCheck className="text-primary size-5 shrink-0" aria-hidden />
              ) : (
                <Icons.circle className="text-muted-foreground size-5 shrink-0" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t(`steps.${step.id}.title`)}</p>
                <p className="text-muted-foreground text-xs">{t(`steps.${step.id}.text`)}</p>
              </div>
              {!finished ? (
                <div className="flex items-center gap-1">
                  <LinkButton href={step.href}>{t(`steps.${step.id}.action`)}</LinkButton>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8"
                    aria-label={t("dismissStep", { step: t(`steps.${step.id}.title`) })}
                    onClick={() => dismiss([step.id])}
                  >
                    <Icons.close aria-hidden />
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </TodayCard>
  )
}
