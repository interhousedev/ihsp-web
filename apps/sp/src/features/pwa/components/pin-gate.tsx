"use client"

import type { ReactNode } from "react"
import { isPwaMode } from "../utils/app-mode"
import { PinGateActive } from "./pin-gate-active"

/**
 * The app lock of the installed app: when the signed-in user has set a PIN, the lock screen covers the app at launch and
 * after 5 minutes in the background. Without a PIN, and in the portal, it renders `children` and nothing else.
 */
export function PinGate({ children }: { children: ReactNode }) {
  if (!isPwaMode()) return <>{children}</>
  return <PinGateActive>{children}</PinGateActive>
}
