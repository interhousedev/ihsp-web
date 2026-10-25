"use client"

import { useAppLock } from "./use-app-lock"
import type { PinGateProps } from "./pin-gate"
import { PinLockScreen } from "./pin-lock-screen"

/** The pwa-mode half of `PinGate`. The app stays mounted under the lock (a form half filled is not lost) but cannot be reached. */
export function PinGateActive({ children, rememberedUser }: PinGateProps) {
  const lock = useAppLock(rememberedUser)
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
