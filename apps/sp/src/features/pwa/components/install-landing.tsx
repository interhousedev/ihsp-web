"use client"

import { useT } from "@ihsp/i18n"
import { Button, LanguageSwitcher } from "@ihsp/ui"
import type { InstallOutcome } from "../hooks/use-install-prompt"
import type { InstallView } from "../utils/install-view"
import { AndroidInstallButton } from "./android-install-button"
import { AndroidManualSteps } from "./android-manual-steps"
import { DesktopQr } from "./desktop-qr"
import { InstalledNotice } from "./installed-notice"
import { IosSteps } from "./ios-steps"
import { LandingBenefits } from "./landing-benefits"
import { TelegramLink } from "./telegram-link"

type LandingProps = {
  view: Exclude<InstallView, "app">
  inAppBrowser: boolean
  onInstall: () => Promise<InstallOutcome>
  onContinue: () => void
}

/**
 * "Please add our app to your phone": the full-screen page a normal browser tab of the installable app shows. What it
 * offers depends on the device: Chrome's install button, the iPhone steps, or a QR code on a computer. Telegram and
 * "Continue in browser" are always there.
 */
export function InstallLanding({ view, inAppBrowser, onInstall, onContinue }: LandingProps) {
  const t = useT("pwa")
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md justify-end">
        <LanguageSwitcher className="min-h-11 w-40" />
      </div>
      <div className="flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-4">
        <header className="flex flex-col items-center gap-3 text-center">
          {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the icon is a plain file of /public */}
          <img src="/icons/icon-192.png" alt="" width={72} height={72} className="rounded-2xl shadow-sm" />
          <h1 className="text-2xl font-semibold">{t("landing.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("landing.subtitle")}</p>
        </header>
        {view === "installed" ? null : <LandingBenefits />}
        {view === "installed" ? <InstalledNotice /> : null}
        {view === "android-prompt" ? <AndroidInstallButton onInstall={onInstall} /> : null}
        {view === "android-manual" ? <AndroidManualSteps /> : null}
        {view === "ios" ? <IosSteps openInSafari={inAppBrowser} /> : null}
        {view === "desktop" ? <DesktopQr /> : null}
        <TelegramLink />
        <Button variant="ghost" className="min-h-11 w-full" onClick={onContinue}>
          {t("continue")}
        </Button>
      </div>
    </main>
  )
}
