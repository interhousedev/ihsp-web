"use client"

import { useEffect, useState } from "react"
import { MAX_REVIEW_UNIS, useReviewUnis, useStoredReviews } from "../../flow/steps-api"

const storageKey = (essayId: string) => `ihsp:essay-read-unis:${essayId}`

function load(essayId: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey(essayId))
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : null
  } catch {
    return null
  }
}

/**
 * The universities a read is run for: the student's own, each included or not (kept per essay in localStorage;
 * every one is included until the student picks), plus the per-university reviews and which of them are running.
 */
export function useReadUnis(essayId: string, institutionIds: string[]) {
  const stored = useStoredReviews(essayId)
  const review = useReviewUnis(essayId)
  const [picked, setPicked] = useState<string[] | null>(null)
  const [pending, setPending] = useState<string[]>([])
  const [error, setError] = useState<unknown>(null)
  useEffect(() => setPicked(load(essayId)), [essayId])

  const selected = institutionIds.filter((id) => picked === null || picked.includes(id))
  const reviewed = new Map((stored.data?.universities ?? []).map((u) => [u.institution_id, u]))

  const setSelected = (id: string, on: boolean) => {
    const base = picked ?? institutionIds
    const next = on ? [...new Set([...base, id])] : base.filter((x) => x !== id)
    setPicked(next)
    try {
      window.localStorage.setItem(storageKey(essayId), JSON.stringify(next))
    } catch {
      /* storage may be blocked; the choice then lasts for this visit only */
    }
  }
  const run = async (ids: string[]) => {
    const target = ids.slice(0, MAX_REVIEW_UNIS)
    if (target.length === 0) return
    setError(null)
    setPending((p) => [...p, ...target])
    try {
      await review.mutateAsync(target)
    } catch (e) {
      setError(e)
    } finally {
      setPending((p) => p.filter((x) => !target.includes(x)))
    }
  }
  return {
    institutionIds,
    selected,
    reviewed,
    pending,
    error,
    isSelected: (id: string) => selected.includes(id),
    setSelected,
    runSelected: () => run(selected),
    runOne: (id: string) => run([id]),
  }
}

export type ReadUnis = ReturnType<typeof useReadUnis>
