"use client"

import type { ReactNode } from "react"
import { useInstallView } from "../hooks/use-install-view"
import { InstallLanding } from "./install-landing"

/** The pwa-mode half of `PwaGate`: the app when this is the installed app, otherwise the install page. */
export function InstallGate({ children }: { children: ReactNode }) {
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
