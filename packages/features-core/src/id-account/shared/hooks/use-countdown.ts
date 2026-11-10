"use client"

import { useCallback, useEffect, useState } from "react"

/** Counts `seconds` down to zero (the 60 second cooldown before a new OTP code, ID-14); `restart` begins again. */
export function useCountdown(seconds: number): { left: number; restart: () => void } {
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    if (left <= 0) return
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])

  const restart = useCallback(() => setLeft(seconds), [seconds])
  return { left, restart }
}
