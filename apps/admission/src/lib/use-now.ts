"use client"

import { useEffect, useState } from "react"

/** The current time in milliseconds, refreshed every `everyMs` so time-based views stay correct without impure renders. */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(id)
  }, [everyMs])
  return now
}
