"use client"

import { isApiError, putLibraryProgress } from "@ihsp/api"
import { useCallback, useEffect, useRef } from "react"
import { percentOf, writeStoredPosition, type Locator } from "./lib/locator"

// Reading progress (`PUT /me/library/progress/{item_id}`): at most one write every
// 15 seconds, one more when the page is hidden or closed, and one when the reader unmounts. The server keeps the write
// with the newest `client_ts`. The place is also kept on this device at once (the API has no call that returns it).

export const PROGRESS_INTERVAL_MS = 15_000
/** A pause longer than this between two reports is not counted as reading time. */
const MAX_SECONDS_PER_REPORT = 120

type Pending = { locator: Locator; fraction: number }

export function useProgressSaver({
  itemId,
  fileId,
  enabled,
  intervalMs = PROGRESS_INTERVAL_MS,
}: {
  itemId: string
  fileId: string
  /** False for visitors (nothing is saved on the server) and for items that cannot be read. */
  enabled: boolean
  intervalMs?: number
}) {
  const pending = useRef<Pending | null>(null)
  const lastSentAt = useRef(0)
  const lastSentKey = useRef<string | null>(null)
  const lastReportAt = useRef<number | null>(null)
  const seconds = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopped = useRef(false)

  const send = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const next = pending.current
    if (!enabled || !next || stopped.current) return
    const key = JSON.stringify(next.locator)
    if (key === lastSentKey.current && seconds.current < 10) return
    pending.current = null
    lastSentAt.current = Date.now()
    lastSentKey.current = key
    const readSeconds = Math.round(seconds.current)
    seconds.current = 0
    putLibraryProgress(itemId, {
      file_id: fileId,
      locator: next.locator,
      percent: percentOf(next.fraction),
      client_ts: new Date().toISOString(),
      ...(readSeconds > 0 ? { seconds_read: readSeconds } : {}),
    }).catch((error: unknown) => {
      // The item is gone or cannot hold progress: stop asking. Anything else is tried again with the next position.
      if (isApiError(error) && (error.status === 404 || error.status === 409 || error.status === 403)) {
        stopped.current = true
        return
      }
      seconds.current += readSeconds
      lastSentKey.current = null
    })
  }, [enabled, itemId, fileId])

  const report = useCallback(
    (locator: Locator, fraction: number) => {
      writeStoredPosition(itemId, fileId, locator, fraction)
      if (!enabled) return
      const now = Date.now()
      if (lastReportAt.current !== null && document.visibilityState !== "hidden") {
        seconds.current += Math.min((now - lastReportAt.current) / 1000, MAX_SECONDS_PER_REPORT)
      }
      lastReportAt.current = now
      pending.current = { locator, fraction }
      const wait = lastSentAt.current + intervalMs - now
      if (wait <= 0) send()
      else if (!timer.current) timer.current = setTimeout(send, wait)
    },
    [enabled, itemId, fileId, intervalMs, send],
  )

  useEffect(() => {
    function onHide() {
      if (document.visibilityState === "hidden") send()
    }
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", send)
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", send)
      send()
    }
  }, [send])

  return { report, flush: send }
}
