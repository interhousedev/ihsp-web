"use client"

import type { ReactNode } from "react"
import { isPwaMode } from "../utils/app-mode"
import { PinGateActive } from "./pin-gate-active"

export type PinGateProps = {
  children: ReactNode
  /** The id of the user who was signed in last (an app that keeps an offline session): the lock is then there at the first paint. */
  rememberedUser?: () => string | null
}

/**
 * The app lock of the installed app: when the signed-in user has set a PIN, the lock screen covers the app at launch and
 * after the time the user chose in the background. Without a PIN, and in the portal, it renders `children` and nothing else.
 */
export function PinGate({ children, rememberedUser }: PinGateProps) {
  if (!isPwaMode()) return <>{children}</>
  return <PinGateActive rememberedUser={rememberedUser}>{children}</PinGateActive>
}
