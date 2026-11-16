"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AdmissionDocument } from "../documents/api"

const BASE = "/v1/admission"

export type Transcript = {
  id: string
  student_id: string | null
  student_name: string | null
  class_name: string | null
  destination_note: string
  status: "requested" | "ready" | "cancelled"
  requested_at: string | null
  ready_at: string | null
  undo_until: string | null
  pickup_location: string | null
  document_id: string | null
  lock_version: number
}

export const TRANSCRIPTS_KEY = ["admission", "transcripts"] as const
export const OFFICER_KEY = ["admission", "officer-transcripts"] as const
export const STAFF_TRANSCRIPTS_KEY = ["admission", "staff-transcripts"] as const
export const OFFICER_SETTINGS_KEY = ["admission", "officer-settings"] as const

export function useMyTranscripts() {
  return useQuery({
    queryKey: TRANSCRIPTS_KEY,
    queryFn: () => getApiClient().get<Transcript[]>(`${BASE}/transcripts`),
  })
}

export function useOfficerTranscripts(status: Transcript["status"] = "requested") {
  return useQuery({
    queryKey: [...OFFICER_KEY, status],
    queryFn: () => getApiClient().get<Transcript[]>(`${BASE}/officer/transcripts`, { query: { status } }),
  })
}

export function useStaffTranscripts(status: string | null) {
  return useQuery({
    queryKey: [...STAFF_TRANSCRIPTS_KEY, status],
    queryFn: () => getApiClient().get<Transcript[]>(`${BASE}/staff/transcripts`, { query: { status } }),
  })
}

export function useOfficerSettings() {
  return useQuery({
    queryKey: OFFICER_SETTINGS_KEY,
    queryFn: () => getApiClient().get<{ pickup_location: Record<string, string> }>(`${BASE}/officer/settings`),
  })
}

function useInvalidateAll() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ["admission"] })
}

export function useRequestTranscript() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (destinationNote: string) =>
      getApiClient().post<{ request: Transcript; reused: boolean }>(`${BASE}/transcripts`, {
        destination_note: destinationNote,
      }),
    onSuccess: invalidate,
  })
}

export function useCancelTranscript() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (id: string) => getApiClient().post<Transcript>(`${BASE}/transcripts/${encodeURIComponent(id)}/cancel`),
    onSuccess: invalidate,
  })
}

export function useUploadScan() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append("file", file)
      return getApiClient().request<AdmissionDocument>({
        method: "POST",
        path: `${BASE}/transcripts/${encodeURIComponent(id)}/scan`,
        formData,
      })
    },
    onSuccess: async () => {
      await invalidate()
    },
  })
}

export function useOfficerDone() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, lockVersion }: { id: string; lockVersion: number }) =>
      getApiClient().post<{ request: Transcript; already: boolean }>(
        `${BASE}/officer/transcripts/${encodeURIComponent(id)}/done`,
        { lock_version: lockVersion },
      ),
    onSuccess: invalidate,
  })
}

export function useOfficerUndo() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (id: string) =>
      getApiClient().post<Transcript>(`${BASE}/officer/transcripts/${encodeURIComponent(id)}/undo`),
    onSuccess: invalidate,
  })
}

export function useSetPickup() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (pickup: Record<string, string>) =>
      getApiClient().put<{ pickup_location: Record<string, string> }>(`${BASE}/officer/settings`, {
        pickup_location: pickup,
      }),
    onSuccess: (data) => client.setQueryData(OFFICER_SETTINGS_KEY, data),
  })
}

export function useRemindTranscript() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (id: string) =>
      getApiClient().post<Transcript>(`${BASE}/staff/transcripts/${encodeURIComponent(id)}/remind`),
    onSuccess: invalidate,
  })
}
