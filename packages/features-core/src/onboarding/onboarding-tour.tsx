"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog } from "@ihsp/ui"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { usePlatformLinks } from "../platform-links"
import { isInternalHref } from "../shell/link-button"
import { useOnboardingTour } from "./use-onboarding-tour"

type IconName = "notification" | "globe" | "palette" | "connectors"

type OnboardingTourProps = {
  /** Which welcome text to show. */
  variant: "student" | "staff"
  /** The app's Settings page: notifications, language and appearance live there. */
  settingsHref: string
  /** The "connect your AI" wizard; the row is left out without it. */
  connectAiHref?: string
}

const STEPS = ["welcome", "apps", "settings"] as const

const ROW = "hover:bg-muted flex min-h-11 items-center gap-3 rounded-lg border p-3 text-start text-sm"

function TourLink({ href, onClick, children }: { href: string; onClick: () => void; children: ReactNode }) {
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={ROW} onClick={onClick}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={ROW} onClick={onClick}>
      {children}
    </a>
  )
}

function Row({ icon, title, hint }: { icon: IconName; title: string; hint: string }) {
  const Icon = Icons[icon]
  return (
    <>
      <Icon aria-hidden className="text-muted-foreground size-5 shrink-0" />
      <span className="flex min-w-0 flex-col">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{hint}</span>
      </span>
    </>
  )
}

/**
 * The first-run tour (what the app is, the other apps, the settings to set first). It opens by itself until it is
 * closed once (remembered in the user's preferences) and again through `replayOnboardingTour()`.
 */
export function OnboardingTour({ variant, settingsHref, connectAiHref }: OnboardingTourProps) {
  const t = useT("onboarding")
  const { open, close } = useOnboardingTour()
  const platforms = usePlatformLinks()
  const [index, setIndex] = useState(0)
  const step = STEPS[index] ?? STEPS[0]
  const last = index === STEPS.length - 1
  const others = platforms.filter((platform) => !platform.current)

  const finish = () => {
    setIndex(0)
    close()
  }

  const settingsRows: {
    icon: IconName
    key: "notifications" | "language" | "appearance" | "connectAi"
    href: string
  }[] = [
    { icon: "notification", key: "notifications", href: settingsHref },
    { icon: "globe", key: "language", href: settingsHref },
    { icon: "palette", key: "appearance", href: settingsHref },
    ...(connectAiHref ? [{ icon: "connectors" as const, key: "connectAi" as const, href: connectAiHref }] : []),
  ]

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish()
      }}
      title={t(`${step}.title`)}
      description={t("step", { current: index + 1, total: STEPS.length })}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={finish}>
            {t("skip")}
          </Button>
          <div className="flex gap-2">
            {index > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 md:min-h-8"
                onClick={() => setIndex(index - 1)}
              >
                {t("back")}
              </Button>
            ) : null}
            <Button type="button" className="min-h-11 md:min-h-8" onClick={last ? finish : () => setIndex(index + 1)}>
              {last ? t("done") : t("next")}
            </Button>
          </div>
        </div>
      }
    >
      {step === "welcome" ? (
        <div className="flex flex-col items-start gap-3">
          <Icons.assistant aria-hidden className="text-primary size-8" />
          <p className="text-sm">{t(`welcome.${variant}`)}</p>
        </div>
      ) : null}
      {step === "apps" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">{t("apps.body")}</p>
          {others.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {others.map((platform) => (
                <li key={platform.key}>
                  <a href={platform.href} onClick={platform.onClick} className={ROW}>
                    <Icons.platforms aria-hidden className="text-muted-foreground size-5 shrink-0" />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{platform.name}</span>
                      <span className="text-muted-foreground">{platform.description}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{t("apps.none")}</p>
          )}
        </div>
      ) : null}
      {step === "settings" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">{t("settings.body")}</p>
          <ul className="flex flex-col gap-2">
            {settingsRows.map((row) => (
              <li key={row.key}>
                <TourLink href={row.href} onClick={finish}>
                  <Row icon={row.icon} title={t(`settings.${row.key}`)} hint={t(`settings.${row.key}Hint`)} />
                </TourLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ResponsiveDialog>
  )
}
