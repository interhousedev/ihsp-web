"use client"

import { useEffect, useRef, useState } from "react"
import { useReadUnis } from "./read-unis"
import { useDeepRead, useRunDeepRead, type DeepRead } from "../../flow/steps-api"

/**
 * The deep read of the essay being edited and whether the text moved on since it. The server says `stale` when the
 * essay changed before this visit; the baseline catches edits made while the editor is open.
 */
export function useReadState(
  essayId: string,
  body: string,
  beforeRun: () => Promise<unknown>,
  institutionIds: string[],
) {
  const query = useDeepRead(essayId)
  const run = useRunDeepRead(essayId)
  const unis = useReadUnis(essayId, institutionIds)
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
    run.mutate(read !== null, {
      onSuccess: () => {
        setBaseline(latest.current)
        void unis.runSelected()
      },
    })
  }
  return { query, run, read, stale, start, unis }
}

export type ReadState = ReturnType<typeof useReadState>
