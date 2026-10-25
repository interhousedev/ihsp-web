"use client"

import { PinGate as SharedPinGate } from "@ihsp/features-core/pwa/lock"
import type { ReactNode } from "react"
import { loadOfflineSession } from "../utils/offline-session"

const rememberedUser = () => loadOfflineSession()?.id ?? null

/** The app lock of the student app: the user of the offline session is the one the lock asks for at the first paint. */
export function PinGate({ children }: { children: ReactNode }) {
  return <SharedPinGate rememberedUser={rememberedUser}>{children}</SharedPinGate>
}
