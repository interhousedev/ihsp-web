"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { ConnectAiLink } from "../connect-ai"
import { usePlatformLinks } from "../platform-links"
import { isInternalHref } from "../shell/link-button"
import { TourPill } from "./tour-pill"
import { useOnboardingTour } from "./use-onboarding-tour"

type IconName =
  | "notification"
  | "globe"
  | "palette"
  | "connectors"
  | "assistant"
  | "notebooks"
  | "flashcards"
  | "mail"
  | "certificates"
  | "library"
  | "platforms"

/** Places inside the app the tour can point to. */
export type TourPlaceKey = "assistant" | "notebooks" | "flashcards" | "mail" | "certificates"

export type TourPlace = { key: TourPlaceKey; href: string }

type OnboardingTourProps = {
  /** Which welcome text to show. */
  variant: "student" | "staff"
  /** The app's Settings page: notifications, language and appearance live there. */
  settingsHref: string
  /** The "connect your AI" wizard; the row is left out without it. */
  connectAiHref?: string
  /** Places of this app to introduce in their own step; the step is left out without any. */
  places?: readonly TourPlace[]
}

type StepKey = "welcome" | "places" | "library" | "lms" | "apps" | "settings"

const ROW = "hover:bg-muted flex min-h-11 items-center gap-3 rounded-lg border p-3 text-start text-sm"

/** An internal link keeps the app and only sets the tour aside; another app ends the tour. */
function TourLink({
  href,
  onInternal,
  onExternal,
  children,
}: {
  href: string
  onInternal: () => void
  onExternal: () => void
  children: ReactNode
}) {
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={ROW} onClick={onInternal}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={ROW} onClick={onExternal}>
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
 * The first-run tour (what the app is, its places, the library and LMS, the other apps, the settings to set first).
 * It opens by itself until it is ended once (remembered in the user's preferences) and again through
 * `replayOnboardingTour()`. Clicking out of it or following a link to a place of the app sets it aside: a floating
 * "Back to tour" bar stays until the user resumes or ends it.
 */
export function OnboardingTour({ variant, settingsHref, connectAiHref, places = [] }: OnboardingTourProps) {
  const t = useT("onboarding")
  const { open, paused, index, setIndex, pause, resume, close } = useOnboardingTour()
  const platforms = usePlatformLinks()
  const library = platforms.find((platform) => platform.key === "library")
  const lms = platforms.find((platform) => platform.key === "lms")
  const others = platforms.filter(
    (platform) => !platform.current && platform.key !== "library" && platform.key !== "lms",
  )

  const steps: StepKey[] = [
    "welcome",
    ...(places.length > 0 ? (["places"] as const) : []),
    ...(library ? (["library"] as const) : []),
    ...(lms ? (["lms"] as const) : []),
    ...(others.length > 0 ? (["apps"] as const) : []),
    "settings",
  ]
  const at = Math.min(index, steps.length - 1)
  const step = steps[at] ?? "welcome"
  const last = at === steps.length - 1

  const settingsRows: {
    icon: IconName
    key: "notifications" | "language" | "appearance"
    href: string
  }[] = [
    { icon: "notification", key: "notifications", href: settingsHref },
    { icon: "globe", key: "language", href: settingsHref },
    { icon: "palette", key: "appearance", href: settingsHref },
  ]

  const platformRow = (platform: NonNullable<typeof library>, icon: IconName) => (
    <TourLink href={platform.href} onInternal={pause} onExternal={close}>
      <Row icon={icon} title={platform.name} hint={t("openIn", { name: platform.name })} />
    </TourLink>
  )

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) pause()
        }}
        title={t(`${step}.title`)}
        description={t("step", { current: at + 1, total: steps.length })}
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={close}>
              {t("skip")}
            </Button>
            <div className="flex gap-2">
              {at > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 md:min-h-8"
                  onClick={() => setIndex(at - 1)}
                >
                  {t("back")}
                </Button>
              ) : null}
              <Button type="button" className="min-h-11 md:min-h-8" onClick={last ? close : () => setIndex(at + 1)}>
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
        {step === "places" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">{t("places.body")}</p>
            <ul className="flex flex-col gap-2">
              {places.map((place) => (
                <li key={place.key}>
                  <TourLink href={place.href} onInternal={pause} onExternal={close}>
                    <Row icon={place.key} title={t(`places.${place.key}`)} hint={t(`places.${place.key}Hint`)} />
                  </TourLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {step === "library" && library ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">{t("library.body")}</p>
            {platformRow(library, "library")}
          </div>
        ) : null}
        {step === "lms" && lms ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">{t("lms.body")}</p>
            {platformRow(lms, "platforms")}
          </div>
        ) : null}
        {step === "apps" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">{t("apps.body")}</p>
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
          </div>
        ) : null}
        {step === "settings" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">{t("settings.body")}</p>
            <ul className="flex flex-col gap-2">
              {settingsRows.map((row) => (
                <li key={row.key}>
                  <TourLink href={row.href} onInternal={pause} onExternal={close}>
                    <Row icon={row.icon} title={t(`settings.${row.key}`)} hint={t(`settings.${row.key}Hint`)} />
                  </TourLink>
                </li>
              ))}
              {connectAiHref ? (
                <li>
                  <ConnectAiLink href={connectAiHref} onOpen={pause} onClick={close} className={ROW}>
                    <Row icon="connectors" title={t("settings.connectAi")} hint={t("settings.connectAiHint")} />
                  </ConnectAiLink>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </ResponsiveDialog>
      {paused ? <TourPill current={at + 1} total={steps.length} onResume={resume} onEnd={close} /> : null}
    </>
  )
}
