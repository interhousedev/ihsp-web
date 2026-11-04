"use client"

import { StateView } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * `/manage/reports/` moved into the review queue: the reported items are the queue's `reports` tab. The page sends the
 * librarian there in the browser (a static export has no server redirect) and keeps the other query parameters.
 */
export function ReportsPage() {
  const router = useRouter()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set("tab", "reports")
    router.replace(`/manage/queue/?${params.toString()}`)
  }, [router])
  return <StateView state="loading" rows={1} />
}
