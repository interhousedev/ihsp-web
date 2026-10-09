"use client"

import type { ReactNode } from "react"
import { useAppLock } from "../hooks/use-app-lock"
import { PinLockScreen } from "./pin-lock-screen"

/** The pwa-mode half of `PinGate`. The app stays mounted under the lock (a form half filled is not lost) but cannot be reached. */
export function PinGateActive({ children }: { children: ReactNode }) {
  const lock = useAppLock()
  const { locked, userId, record, unlock } = lock
  return (
    <>
      <div className="contents" inert={locked}>
        {children}
      </div>
      {locked && userId && record ? <PinLockScreen userId={userId} record={record} onUnlock={unlock} /> : null}
    </>
  )
}
