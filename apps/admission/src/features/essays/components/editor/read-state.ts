"use client"

import { useEffect, useRef, useState } from "react"
import { useDeepRead, useRunDeepRead, type DeepRead } from "../../flow/steps-api"

/**
 * The deep read of the essay being edited and whether the text moved on since it. The server says `stale` when the
 * essay changed before this visit; the baseline catches edits made while the editor is open.
 */
export function useReadState(essayId: string, body: string, beforeRun: () => Promise<unknown>) {
  const query = useDeepRead(essayId)
  const run = useRunDeepRead(essayId)
  const [baseline, setBaseline] = useState<string | null>(null)
  const latest = useRef(body)
  latest.current = body
  const data = query.data
  useEffect(() => {
    if (data?.read && !data.stale && baseline === null) setBaseline(latest.current)
  }, [data, baseline])

  const read: DeepRead | null = data?.read ?? null
  const stale = !!read && (data?.stale === true || (baseline !== null && body !== baseline))
  const start = async () => {
    try {
      await beforeRun()
    } catch {
      return
    }
    run.mutate(read !== null, { onSuccess: () => setBaseline(latest.current) })
  }
  return { query, run, read, stale, start }
}

export type ReadState = ReturnType<typeof useReadState>
