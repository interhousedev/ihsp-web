"use client"

import { ApiError, getApiClient } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import type { Grade } from "@ihsp/ui"

export type Carrier = { ref_kind: "answer" | "course"; ref_id: string; strength: "weak" | "strong" }
export type WordFit = { word: string; level: "strong" | "weak" | "none"; carriers: Carrier[] }

export type AlignmentPayload = {
  words?: WordFit[]
  orphans?: { ref_kind: string; ref_id: string }[]
  gaps?: { word: string; advice: string }[]
  message_key?: string
}

export type Alignment = {
  created_at: string
  grades: Record<string, string>
  message_key: string | null
  overall: Grade | null
  payload: AlignmentPayload
  safety_flag: "none" | "injection_suspected" | "safeguarding"
  stale: boolean
  words_version: number
}

export const ALIGNMENT_KEY = ["admission", "alignment"] as const

/** The latest report, or `null` when none was made yet (the backend answers 404). */
export async function fetchAlignment(): Promise<Alignment | null> {
  try {
    return await getApiClient().get<Alignment>("/v1/admission/me/alignment")
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function createAlignment(): Promise<Alignment> {
  return getApiClient().post<Alignment>("/v1/admission/me/alignment")
}

export function useAlignment() {
  return useQuery({ queryKey: ALIGNMENT_KEY, queryFn: fetchAlignment })
}
