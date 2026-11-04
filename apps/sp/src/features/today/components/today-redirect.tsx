"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * The old Today address: Today is the Home page now, so the address replaces itself with `/`. The static export has no
 * server to redirect, so the page does it in an effect.
 */
export function TodayRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/")
  }, [router])

  return null
}
