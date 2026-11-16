"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** The chooser opens on the search. */
export default function Page() {
  const router = useRouter()
  useEffect(() => router.replace("/chooser/search/"), [router])
  return null
}
