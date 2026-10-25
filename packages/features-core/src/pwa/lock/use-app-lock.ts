"use client"

import { useAuthStore } from "@ihsp/auth"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  DEFAULT_RELOCK,
  isLockedAtLaunch,
  readActiveMarker,
  shouldLockOnReturn,
  writeActiveMarker,
  type RelockOption,
} from "./lock-policy"
import type { PinRecord } from "./pin"
import { PIN_STORAGE_PREFIX, readPinRecord } from "./pin-storage"
import { usePinRecord } from "./use-pin-record"

/** The user whose PIN is stored on this device: apps without an offline session know the last user from it (a PIN is removed on sign-out). */
function storedPinUser(): string | null {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(PIN_STORAGE_PREFIX)) return key.slice(PIN_STORAGE_PREFIX.length)
    }
  } catch {
    // Storage is blocked: nothing to lock.
  }
  return null
}

export type AppLock = {
  /** The lock screen must cover the app. */
  locked: boolean
  userId: string | null
  record: PinRecord | null
  unlock: () => void
}

/**
 * Whether the app is locked. A launch (no recent activity in this session) is locked when the user has a PIN; so is a
 * return to the foreground after the delay the user chose (immediately, 1, 5 or 15 minutes, 1 hour, or never). Before the session is restored the user is the one who was signed in last
 * (`useOfflineSession` remembers them), so the lock is already there at the first paint.
 */
export function useAppLock(rememberedUser: () => string | null = storedPinUser): AppLock {
  const sessionUserId = useAuthStore((state) => state.user?.id ?? null)
  const [rememberedUserId] = useState(rememberedUser)
  const userId = sessionUserId ?? rememberedUserId
  const record = usePinRecord(userId)
  const [lockedByTime, setLockedByTime] = useState(() => {
    const remembered = readPinRecord(rememberedUserId)
    return isLockedAtLaunch(remembered !== null, readActiveMarker(), Date.now(), remembered?.relock ?? DEFAULT_RELOCK)
  })
  // The handlers below are added once; this is what they should know now.
  const policy = useRef<{ hasPin: boolean; relock: RelockOption }>({ hasPin: record !== null, relock: DEFAULT_RELOCK })
  useEffect(() => {
    policy.current = { hasPin: record !== null, relock: record?.relock ?? DEFAULT_RELOCK }
  }, [record])

  useEffect(() => {
    let hiddenAt: number | null = null
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now()
        writeActiveMarker(hiddenAt)
        return
      }
      if (shouldLockOnReturn(policy.current.hasPin, hiddenAt, Date.now(), policy.current.relock)) setLockedByTime(true)
      hiddenAt = null
    }
    // A reload or navigation counts as leaving: the marker lets the next load tell a reload from a new launch.
    const onPageHide = () => writeActiveMarker()
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onPageHide)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onPageHide)
    }
  }, [])

  const unlock = useCallback(() => {
    writeActiveMarker()
    setLockedByTime(false)
  }, [])

  // Without a PIN (never set, removed, or the user signed out) there is nothing to lock.
  return { locked: lockedByTime && record !== null, userId, record, unlock }
}
