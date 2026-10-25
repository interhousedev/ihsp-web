"use client"

import { installRequestUrl, readPageEnvironment, type Platform } from "@ihsp/features-core/pwa"
import { useT } from "@ihsp/i18n"
import {
  IconCheck,
  IconDotsVertical,
  IconDownload,
  IconExternalLink,
  IconShare2,
  IconSquarePlus,
  LanguageSwitcher,
  buttonVariants,
} from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useHubApps, type HubApp } from "../hooks/use-hub-apps"
import { HUB_ICONS } from "./apps-hub"
import { StepList, type Step } from "./step-list"

/** The app the address names: `/install/?app=library` → `library`. */
export function readInstallAppKey(search: string): string | null {
  return new URLSearchParams(search).get("app")
}

function useSteps(platform: Platform, name: string): Step[] {
  const t = useT("pwa")
  if (platform === "ios") {
    return [
      { icon: IconExternalLink, text: t("appInstall.ios.step1", { name }) },
      { icon: IconShare2, text: t("appInstall.ios.step2") },
      { icon: IconSquarePlus, text: t("appInstall.ios.step3") },
      { icon: IconCheck, text: t("appInstall.ios.step4", { name }) },
    ]
  }
  if (platform === "android") {
    return [
      { icon: IconExternalLink, text: t("appInstall.android.step1", { name }) },
      { icon: IconDownload, text: t("appInstall.android.step2") },
      { icon: IconDotsVertical, text: t("appInstall.android.step3") },
    ]
  }
  return [
    { icon: IconExternalLink, text: t("appInstall.desktop.step1", { name }) },
    { icon: IconDownload, text: t("appInstall.desktop.step2") },
  ]
}

function AppInstallContent({ app }: { app: HubApp & { href: string } }) {
  const t = useT("pwa")
  const [environment] = useState(readPageEnvironment)
  const steps = useSteps(environment.platform, app.name)
  const Icon = HUB_ICONS[app.key]
  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="bg-card flex size-18 items-center justify-center rounded-2xl border shadow-sm">
          <Icon aria-hidden className="text-primary size-10" />
        </span>
        <h1 className="text-2xl font-semibold">{t("appInstall.title", { name: app.name })}</h1>
        <p className="text-muted-foreground text-sm">{app.description}</p>
      </header>
      <p role="note" className="bg-muted text-muted-foreground rounded-lg p-3 text-sm">
        {t("appInstall.ownAddress", { name: app.name })}
      </p>
      {environment.platform === "ios" && environment.inAppBrowser ? (
        <p role="note" className="bg-muted text-muted-foreground rounded-lg p-3 text-sm">
          {t("ios.openInSafari")}
        </p>
      ) : null}
      <a href={installRequestUrl(app.href)} className={buttonVariants({ className: "h-12 w-full text-base" })}>
        <IconDownload aria-hidden />
        {t("appInstall.open", { name: app.name })}
      </a>
      <section className="flex flex-col gap-3" aria-labelledby="pwa-app-steps-title">
        <h2 id="pwa-app-steps-title" className="text-base font-semibold">
          {t("appInstall.stepsTitle")}
        </h2>
        <StepList steps={steps} />
      </section>
    </>
  )
}

/**
 * The hub's install page of one app (`/install/?app=library`). A browser installs a web app only from the app's own
 * address, so this page cannot install Library itself: it explains the steps for this device and opens the app with
 * `?install=1`, where the app offers the browser's install dialog (Chrome, Edge) or the iPhone steps right away.
 */
export function AppInstallPage() {
  const t = useT("pwa")
  const apps = useHubApps()
  const [key] = useState(() => readInstallAppKey(window.location.search))
  const app = apps.find((candidate) => candidate.key === key)
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md justify-end">
        <LanguageSwitcher className="min-h-11 w-40" />
      </div>
      <div className="flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-4">
        {app?.href ? (
          <AppInstallContent app={{ ...app, href: app.href }} />
        ) : (
          <p role="alert" className="text-center text-sm">
            {t("appInstall.unknown")}
          </p>
        )}
        <Link href="/" className={buttonVariants({ variant: "ghost", className: "min-h-11 w-full" })}>
          {t("appInstall.back")}
        </Link>
      </div>
    </main>
  )
}
