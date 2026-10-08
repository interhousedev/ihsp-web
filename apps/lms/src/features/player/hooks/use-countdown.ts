"use client"

import { useEffect, useState } from "react"

/**
 * Seconds left until `deadline` (an ISO time), updated twice a second; `null` without a deadline. `onExpire` runs once
 * when the time is over (also when the deadline had already passed on mount).
 */
export function useCountdown(deadline: string | null, onExpire: () => void): number | null {
  const deadlineMs = deadline ? Date.parse(deadline) : null
  const [remaining, setRemaining] = useState<number | null>(() =>
    deadlineMs === null ? null : Math.max(0, (deadlineMs - Date.now()) / 1000),
  )

  useEffect(() => {
    if (deadlineMs === null) return
    let expired = false
    const tick = () => {
      const left = Math.max(0, (deadlineMs - Date.now()) / 1000)
      setRemaining(left)
      if (left <= 0 && !expired) {
        expired = true
        window.clearInterval(timer)
        onExpire()
      }
    }
    const timer = window.setInterval(tick, 500)
    tick()
    return () => window.clearInterval(timer)
    // `onExpire` is kept fresh by the caller through a ref; the interval must not restart when it changes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineMs])

  return remaining
}
