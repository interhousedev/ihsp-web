"use client"

import { logout } from "@ihsp/auth"
import { useCallback, useEffect, useState } from "react"

export type PinSignOut = {
  signOut: () => Promise<void>
  /** The sign-out is running. */
  busy: boolean
  /** The server could not be reached: the app stays locked and tries again when the network is back. */
  failed: boolean
}

/**
 * Signs the user out for good (too many wrong PINs, or "Forgot PIN"). The PIN is removed with the session, so it can only
 * be removed once the server has ended the session: offline, the app stays locked and retries when the network returns,
 * instead of letting someone in whose PIN guesses ran out.
 */
export function usePinSignOut(): PinSignOut {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle")

  const signOut = useCallback(async () => {
    setState("busy")
    try {
      await logout()
    } catch {
      setState("failed")
    }
  }, [])

  useEffect(() => {
    if (state !== "failed") return
    const retry = () => void signOut()
    window.addEventListener("online", retry)
    return () => window.removeEventListener("online", retry)
  }, [state, signOut])

  return { signOut, busy: state === "busy", failed: state === "failed" }
}
