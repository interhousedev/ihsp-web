"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** `/colleges/` has no page of its own: it opens the chooser. */
export default function Page() {
  const router = useRouter()
  useEffect(() => router.replace("/chooser/"), [router])
  return null
}
