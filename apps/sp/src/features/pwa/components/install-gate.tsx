"use client"

import { HUB_INSTALL_PATH } from "@ihsp/features-core/pwa"
import type { ReactNode } from "react"
import { useInstallView } from "../hooks/use-install-view"
import { InstallLanding } from "./install-landing"

/** The hub's install pages of the other apps (`/install/?app=lms`) are shown as they are, in a tab or in the app. */
function isAppInstallPage(): boolean {
  return window.location.pathname.startsWith(HUB_INSTALL_PATH.replace(/\/$/, ""))
}

/** The pwa-mode half of `PwaGate`: the app when this is the installed app, otherwise the install page. */
export function InstallGate({ children }: { children: ReactNode }) {
  if (isAppInstallPage()) return <>{children}</>
  return <InstallScreen>{children}</InstallScreen>
}

function InstallScreen({ children }: { children: ReactNode }) {
  const state = useInstallView()
  if (state.view === "app") return <>{children}</>
  return (
    <InstallLanding
      view={state.view}
      inAppBrowser={state.environment.inAppBrowser}
      onInstall={state.install}
      onContinue={state.continueInBrowser}
    />
  )
}
