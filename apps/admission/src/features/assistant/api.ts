"use client"

import {
  type AdmissionAssistantMessageIn,
  type AdmissionAssistantReply,
  type AdmissionAssistantThread,
  type AdmissionAssistantThreads,
  getApiClient,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/assistant"

export type ScreenPayload = AdmissionAssistantMessageIn["screen"]
export type AssistantReply = AdmissionAssistantReply
export type Citation = AssistantReply["citations"][number]
export type AssistantAction = AssistantReply["actions"][number]
/** `propose_task` actions always carry `task`; the generated action is one flat shape. */
export type ProposeTaskAction = AssistantAction & { kind: "propose_task"; task: NonNullable<AssistantAction["task"]> }
export type OpenAction = AssistantAction & { kind: "open"; url_path: string }
export type Thread = AdmissionAssistantThread
export type ThreadMessage = Thread["messages"][number]
export type ThreadSummary = AdmissionAssistantThreads["items"][number]

export const THREADS_KEY = ["admission", "assistant", "threads"] as const

export function useSendMessage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: AdmissionAssistantMessageIn) => getApiClient().post<AssistantReply>(`${BASE}/messages`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: THREADS_KEY }),
  })
}

export function useThreads(enabled: boolean) {
  return useQuery({
    queryKey: THREADS_KEY,
    enabled,
    queryFn: async () => (await getApiClient().get<{ items: ThreadSummary[] }>(`${BASE}/threads`)).items,
  })
}

export function useLoadThread() {
  return useMutation({
    mutationFn: (id: string) => getApiClient().get<Thread>(`${BASE}/threads/${encodeURIComponent(id)}`),
  })
}

export function useDeleteThread() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete(`${BASE}/threads/${encodeURIComponent(id)}`),
    onSuccess: () => client.invalidateQueries({ queryKey: THREADS_KEY }),
  })
}

/** Starter prompts for the screen the user is on. */
export function useSuggestions(path: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admission", "assistant", "suggestions", path],
    enabled,
    queryFn: async () =>
      (await getApiClient().get<{ items: string[] }>(`${BASE}/suggestions`, { query: { path } })).items,
  })
}
