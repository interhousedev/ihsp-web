"use client"

import { useEffect } from "react"
import { initErrorTracking, readBugsinkDsn } from "./error-tracking"

/** Starts error tracking once in the browser, when `NEXT_PUBLIC_BUGSINK_DSN` is set. Renders nothing. */
export function ErrorTrackingInit() {
  useEffect(() => {
    initErrorTracking(readBugsinkDsn())
  }, [])
  return null
}
