"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { calendarRedirect } from "../utils/redirect"

/**
 * The old attendance address: replaces it with the calendar (the month view unless the address names a view). The
 * search is read from the window so the static export needs no Suspense boundary.
 */
export function AttendanceRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(calendarRedirect(window.location.search))
  }, [router])

  return null
}
