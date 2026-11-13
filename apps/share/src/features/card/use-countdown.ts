"use client"

import { useEffect, useState } from "react"

/**
 * Seconds left until `expiresAt` (never below 0), ticking every second. `offsetMs` is the server clock minus the local
 * one, so the count does not depend on a visitor's wrong clock.
 */
export function useSecondsLeft(expiresAt: string, offsetMs = 0): number {
  const end = new Date(expiresAt).getTime()
  const [now, setNow] = useState(() => Date.now() + offsetMs)
  useEffect(() => {
    setNow(Date.now() + offsetMs)
    const id = setInterval(() => setNow(Date.now() + offsetMs), 1000)
    return () => clearInterval(id)
  }, [expiresAt, offsetMs])
  return Math.max(0, Math.ceil((end - now) / 1000))
}

/** `MM:SS` (or `H:MM:SS`) of a number of seconds. */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const two = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`
}
