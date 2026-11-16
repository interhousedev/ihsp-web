"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** What a student can ask for; the contract enum of `HelpRequestIn.kind` and `GuestLinkIn.kind`. */
export type HelpKind = "website" | "design" | "proof" | "other"

/** Mirrors `HelpRequestOut`; `status` and `kind` are open strings, a new backend value still renders. */
export type HelpRequest = {
  id: string
  student_id: string
  kind: string
  brief: string
  status: string
  item_id: string | null
  helper_user_id: string | null
  expires_at: string | null
}

export type HelpResponse = {
  id: string
  help_request_id: string
  text: string
  url: string | null
  file_id: string | null
  from_guest: boolean
  created_at: string
}

export type HelpActivity = {
  position: string
  org: string
  description: string
  kind: string
  metrics: { label?: string; value?: string }[]
}

export type HelpDetail = {
  request: HelpRequest
  responses: HelpResponse[]
  activities: HelpActivity[] | null
  as_helper: boolean
}

export type Helper = { user_id: string; display_name: string }

export type GuestLink = {
  id: string
  help_request_id: string
  label: string | null
  scope: string[]
  token_prefix: string
  expires_at: string
  revoked_at: string | null
  last_used_at: string | null
  max_sessions: number
  sessions_used: number
  claimed: boolean
}

/** The plain `gst_…` token is in this response only; it is never returned again. */
export type CreatedGuestLink = { help_request_id: string; link: GuestLink; token: string }

export type NewHelpRequest = {
  kind: HelpKind
  brief: string
  helper_user_id?: string | null
  item_id?: string | null
}

export type NewGuestLink = {
  kind: HelpKind
  brief: string
  label?: string | null
  expires_in_days?: number | null
  item_id?: string | null
  help_request_id?: string | null
}

export type Proof = {
  id: string
  item_id: string
  kind: string
  status: string
  url: string | null
  file_id: string | null
  fetched_at: string | null
  title?: string | null
}

export type ProofInput = { url?: string; file_id?: string; pasted_text?: string }

/** Helper search starts at this many characters (the backend answers an empty list below it). */
export const HELPER_SEARCH_MIN = 3

export const helpKeys = {
  all: ["admission", "help"] as const,
  requests: ["admission", "help", "requests"] as const,
  assigned: ["admission", "help", "assigned"] as const,
  detail: (id: string) => ["admission", "help", "detail", id] as const,
  helpers: (q: string) => ["admission", "help", "helpers", q] as const,
  guestLinks: ["admission", "help", "guest-links"] as const,
  proofs: (itemId: string) => ["admission", "proofs", itemId] as const,
}

const BASE = "/v1/admission"

export function useMyHelpRequests() {
  return useQuery({
    queryKey: helpKeys.requests,
    queryFn: () => getApiClient().get<{ items: HelpRequest[] }>(`${BASE}/help-requests`),
  })
}

export function useAssignedRequests() {
  return useQuery({
    queryKey: helpKeys.assigned,
    queryFn: () => getApiClient().get<{ items: HelpRequest[] }>(`${BASE}/help/assigned`),
    retry: false,
  })
}

export function useHelpDetail(id: string | null) {
  return useQuery({
    queryKey: helpKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: () => getApiClient().get<HelpDetail>(`${BASE}/help-requests/${seg(id ?? "")}`),
  })
}

/** Accounts that may be asked for help; disabled below `HELPER_SEARCH_MIN` characters. */
export function useHelperSearch(q: string) {
  const term = q.trim()
  return useQuery({
    queryKey: helpKeys.helpers(term),
    enabled: term.length >= HELPER_SEARCH_MIN,
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: Helper[] }>(`${BASE}/help/helpers`, { query: { q: term }, signal }),
  })
}

export function useGuestLinks() {
  return useQuery({
    queryKey: helpKeys.guestLinks,
    queryFn: () => getApiClient().get<{ items: GuestLink[] }>(`${BASE}/guest-links`),
  })
}

export function useProofs(itemId: string) {
  return useQuery({
    queryKey: helpKeys.proofs(itemId),
    queryFn: () => getApiClient().get<{ items: Proof[] }>(`${BASE}/items/${seg(itemId)}/proofs`),
    // A proof is checked in the background: poll while one is pending.
    refetchInterval: (query) => (query.state.data?.items.some((p) => p.status === "pending") ? 4000 : false),
  })
}

function useInvalidating<TIn, TOut>(
  fn: (input: TIn) => Promise<TOut>,
  extra?: (input: TIn) => readonly (readonly unknown[])[],
) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async (_out, input) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: helpKeys.all }),
        ...(extra?.(input) ?? []).map((queryKey) => client.invalidateQueries({ queryKey })),
      ])
    },
  })
}

export const useCreateHelpRequest = () =>
  useInvalidating((input: NewHelpRequest) => getApiClient().post<HelpRequest>(`${BASE}/help-requests`, input))

export const useCreateGuestLink = () =>
  useInvalidating((input: NewGuestLink) => getApiClient().post<CreatedGuestLink>(`${BASE}/guest-links`, input))

export const useRevokeGuestLink = () =>
  useInvalidating((id: string) => getApiClient().delete<void>(`${BASE}/guest-links/${seg(id)}`))

export const useRotateGuestLink = () =>
  useInvalidating((id: string) => getApiClient().post<CreatedGuestLink>(`${BASE}/guest-links/${seg(id)}/rotate`))

export type HelpAction = "accept" | "decline" | "deliver" | "cancel" | "close"

export const useHelpAction = () =>
  useInvalidating((input: { id: string; action: HelpAction }) =>
    getApiClient().post<HelpRequest>(`${BASE}/help-requests/${seg(input.id)}/${input.action}`),
  )

export const useRespond = () =>
  useInvalidating((input: { id: string; text: string; url?: string | null }) =>
    getApiClient().post<HelpResponse>(`${BASE}/help-requests/${seg(input.id)}/responses`, {
      text: input.text,
      url: input.url || null,
      file_id: null,
    }),
  )

export const useAddProof = (itemId: string) =>
  useInvalidating(
    (input: ProofInput) => getApiClient().post<Proof>(`${BASE}/items/${seg(itemId)}/proofs`, input),
    () => [helpKeys.proofs(itemId)],
  )
