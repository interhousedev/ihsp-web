"use client"

import { useEffect, useState } from "react"

/** The current time, refreshed every `intervalMs` (default 30 s): the "now" lesson and the missing-attendance warnings. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
