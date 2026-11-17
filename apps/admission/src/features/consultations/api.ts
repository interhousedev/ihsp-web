"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type WithKind = "counselor" | "mentor"
export type ConsultFormat = "online" | "offline"
export type LinkedKind = "project" | "essay" | "activity" | "application" | "other"
export type ConsultStatus = "requested" | "proposed" | "accepted" | "declined" | "completed" | "cancelled"
/** Everything a viewer can do with a consultation; the backend sends the allowed subset in `actions`. */
export type ConsultAction = "cancel" | "confirm" | "reject" | "accept" | "propose" | "decline" | "complete"

/** Mirrors `ConsultationOut`. */
export type Consultation = {
  id: string
  student_id: string
  /** Filled in the staff queue only. */
  student_name: string
  with_kind: WithKind
  topic: string
  linked_kind: LinkedKind
  linked_id: string | null
  details: string
  preferred_times: string[]
  format: ConsultFormat
  status: ConsultStatus
  staff_id: string | null
  scheduled_at: string | null
  location: string
  staff_notes: string
  decline_reason: string
  created_at: string | null
  updated_at: string | null
  completed_at: string | null
  viewer: "student" | "staff"
  actions: string[]
}

/** Mirrors `ConsultationIn`. */
export type NewConsultation = {
  with_kind: WithKind
  topic: string
  format: ConsultFormat
  linked_kind?: LinkedKind
  linked_id?: string | null
  details?: string
  preferred_times?: string[]
}

/** The body an action may carry. */
export type ActionBody = { at?: string | null; location?: string; reason?: string; notes?: string }

export const consultKeys = {
  all: ["admission", "consultations"] as const,
  mine: ["admission", "consultations", "mine"] as const,
  queue: (status: string) => ["admission", "consultations", "queue", status] as const,
}

const BASE = "/v1/admission/consultations"

export function useMyConsultations() {
  return useQuery({
    queryKey: consultKeys.mine,
    queryFn: () => getApiClient().get<{ items: Consultation[] }>(BASE),
  })
}

/** Staff queue; `status` is a comma-separated filter, empty for the backend default. */
export function useConsultationQueue(statuses: readonly ConsultStatus[]) {
  const key = statuses.join(",")
  return useQuery({
    queryKey: consultKeys.queue(key),
    queryFn: () =>
      getApiClient().get<{ items: Consultation[] }>(`${BASE}/queue`, {
        query: statuses.length ? { status: [...statuses] } : undefined,
      }),
  })
}

export function useRequestConsultation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewConsultation) => getApiClient().post<Consultation>(BASE, input),
    onSuccess: () => client.invalidateQueries({ queryKey: consultKeys.all }),
  })
}

export function useConsultationAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; action: ConsultAction; body?: ActionBody }) =>
      getApiClient().post<Consultation>(`${BASE}/${seg(input.id)}/${input.action}`, input.body),
    onSuccess: () => client.invalidateQueries({ queryKey: consultKeys.all }),
  })
}
