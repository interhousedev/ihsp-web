"use client"

import { ApiError, getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/staff/prompt-studio/slots"
const KEY = ["admission", "prompt-studio"] as const

/** One stored prompt version (VersionOut). */
export type PromptVersion = {
  version: number
  locale: string
  text: string
  hash: string
  active: boolean
  note: string
  created_at: string
}

/** A finding of the draft validation (IssueOut). */
export type PromptIssue = { severity: "error" | "warning"; code: string; detail: string }

/** A prompt slot with its active text and history (SlotOut). */
export type Slot = {
  task: string
  name: string
  summary: string
  template: boolean
  fields: string[]
  builtin: string
  active_text: string
  active_version: number
  active_hash: string
  versions: PromptVersion[]
}

export type Sample = { text?: string | null; exemplar_id?: string | null; prompt_text?: string; kind?: string }
export type TestBody = { text: string; samples: Sample[]; institution_id?: string | null }

export type RunOut = { model: string; output: Record<string, unknown> }
export type SampleResult = {
  label: string
  exemplar_id: string | null
  active: RunOut
  draft: RunOut
  delta: { score_delta: number | null; band_before: string | null; band_after: string | null; band_changed: boolean }
}
export type TestReport = { warnings: PromptIssue[]; results: SampleResult[] }

/** The codes the server rejects a draft with (422 `params.issues`); an empty list when the error is something else. */
export function blockingCodes(error: unknown): string[] {
  if (!(error instanceof ApiError) || error.status !== 422) return []
  const issues = error.params.issues
  return Array.isArray(issues) ? issues.filter((i): i is string => typeof i === "string") : []
}

const path = (slot: { task: string; name: string }) => `${BASE}/${seg(slot.task)}/${seg(slot.name)}`

export function useSlots() {
  return useQuery({
    queryKey: [...KEY, "slots"] as const,
    queryFn: ({ signal }) => getApiClient().get<{ items: Slot[] }>(BASE, { signal }),
  })
}

export function useSaveSlot(slot: { task: string; name: string }) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: { text: string; note: string }) =>
      getApiClient().put<{ version: PromptVersion; warnings: PromptIssue[] }>(path(slot), { ...body, locale: "" }),
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  })
}

export function useActivateVersion(slot: { task: string; name: string }) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (version: number) =>
      getApiClient().post<PromptVersion>(`${path(slot)}/versions/${version}/activate`, {}),
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRevertSlot(slot: { task: string; name: string }) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => getApiClient().delete<void>(path(slot)),
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  })
}

export function useTestSlot(slot: { task: string; name: string }) {
  return useMutation({
    mutationFn: (body: TestBody) => getApiClient().post<TestReport>(`${path(slot)}/test`, body),
  })
}
