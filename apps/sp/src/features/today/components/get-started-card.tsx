"use client"

import { getMeProfileQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { useQuery } from "@tanstack/react-query"
import { TodayCard } from "./today-card"

type StepId = "telegram" | "subgroup" | "notifications"

type Step = { id: StepId; done: boolean; hint: string | null; href: string }

/**
 * The Get started card of a first visit (UF-WEB-01): link Telegram, check the subgroup, choose notifications.
 * Each step can be dismissed (`onboarding_dismissed`); the card disappears when all steps are done or dismissed.
 */
export function GetStartedCard() {
  const t = useT("today.getStarted")
  const { session } = useSession()
  const preferences = usePreferences()
  const profile = useQuery(getMeProfileQuery())
  const update = useUpdatePreferences()

  if (!session || !preferences || profile.isPending) return null

  const dismissed = preferences.onboarding_dismissed
  const subgroup = profile.data?.subgroup ?? null
  const steps: Step[] = [
    {
      id: "telegram",
      done: session.user.telegram.length > 0,
      hint: null,
      href: `${getConfig().ID_URL}/security/telegram/`,
    },
    {
      id: "subgroup",
      done: subgroup !== null,
      hint: subgroup !== null ? t("subgroupSet", { number: subgroup }) : t("subgroupUnset"),
      href: "/profile/",
    },
    { id: "notifications", done: false, hint: null, href: "/settings/" },
  ]

  const open = steps.filter((step) => !step.done && !dismissed.includes(step.id))
  if (open.length === 0) return null

  function dismiss(ids: StepId[]) {
    update.mutate({ onboarding_dismissed: [...new Set([...dismissed, ...ids])] })
  }

  return (
    <TodayCard
      title={t("title")}
      className="md:col-span-2"
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
                <p className="text-muted-foreground text-xs">{step.hint ?? t(`steps.${step.id}.text`)}</p>
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
