"use client"

import { useEffect, useState } from "react"

/** Seconds left until `expiresAt` (never below 0), ticking every second. */
export function useSecondsLeft(expiresAt: string): number {
  const end = new Date(expiresAt).getTime()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])
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
