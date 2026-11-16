"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** `/consent/` is not a page of its own: the purposes live in the settings. */
export default function Page() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/settings/#consent")
  }, [router])
  return null
}
