"use client"

import type { ReactNode } from "react"
import { isPwaMode } from "../utils/app-mode"
import { InstallGate } from "./install-gate"

/**
 * In the installable app (pwa mode) a normal browser tab shows the "add My IHT to your home screen" page instead of the
 * app; the installed app, the Telegram mini app and "Continue in browser" show the app. In the portal (`my.ihsu.uz`)
 * it renders `children` and nothing else. It sits above the auth provider, so the install page asks for no session.
 */
export function PwaGate({ children }: { children: ReactNode }) {
  if (!isPwaMode()) return <>{children}</>
  return <InstallGate>{children}</InstallGate>
}
