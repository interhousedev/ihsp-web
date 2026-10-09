"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getAppVersion } from "../api/get-app-version"
import { APP_VERSION, decideUpdate, type AppVersionInfo, type UpdateDecision } from "../utils/app-version"
import { VERSION_CHECK_INTERVAL_MS, shouldCheckVersion } from "../utils/update-guard"

export type VersionCheck = { decision: UpdateDecision; info: AppVersionInfo | null }

/**
 * Asks the backend which build is current when the app starts, when it comes back to the foreground or online, and every
 * half hour while it stays open. At most one request a minute. A failed check (offline) changes nothing.
 */
export function useVersionCheck(): VersionCheck {
  const [state, setState] = useState<VersionCheck>({ decision: "none", info: null })
  const lastCheckAt = useRef<number | null>(null)

  const check = useCallback(async () => {
    const now = Date.now()
    if (!shouldCheckVersion(lastCheckAt.current, now)) return
    lastCheckAt.current = now
    try {
      const info = await getAppVersion()
      setState({ decision: decideUpdate(APP_VERSION, info), info })
    } catch {
      // Offline or the server is down: keep what we know, ask again at the next event.
    }
  }, [])

  useEffect(() => {
    void check()
    const onVisible = () => {
      if (document.visibilityState === "visible") void check()
    }
    const onEvent = () => void check()
    const timer = setInterval(onVisible, VERSION_CHECK_INTERVAL_MS)
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onEvent)
    window.addEventListener("online", onEvent)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onEvent)
      window.removeEventListener("online", onEvent)
    }
  }, [check])

  return state
}
