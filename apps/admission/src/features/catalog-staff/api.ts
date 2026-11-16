"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/staff/catalog/proposals"

export type ProposalKind = "institution" | "scholarship"
export type ProposalStatus = "pending" | "approved" | "rejected"

export type Proposal = {
  id: string
  kind: ProposalKind
  target_id: string | null
  fields: Record<string, unknown>
  source_url: string
  note: string | null
  status: ProposalStatus
  proposed_by: string
  created_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  applied_id: string | null
  lock_version: number
}

export type ProposalList = { items: Proposal[]; can_review: boolean }

export type ProposalInput = {
  kind: ProposalKind
  target_id?: string | null
  fields: Record<string, unknown>
  source_url: string
  note?: string | null
}

export const PROPOSALS_KEY = ["admission", "catalog-proposals"] as const

export function useProposals(status: ProposalStatus | null) {
  return useQuery({
    queryKey: [...PROPOSALS_KEY, status] as const,
    queryFn: () => getApiClient().get<ProposalList>(BASE, { query: status ? { status } : {} }),
  })
}

export function useCreateProposal() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: ProposalInput) => getApiClient().post<Proposal>(BASE, body),
    onSuccess: () => client.invalidateQueries({ queryKey: PROPOSALS_KEY }),
  })
}

export function useReviewProposal() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; approve: boolean; note?: string | null; lock_version: number }) =>
      getApiClient().post<Proposal>(`${BASE}/${encodeURIComponent(id)}/review`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: PROPOSALS_KEY }),
  })
}

export type InstitutionHit = { id: string; name: string; country: string }

export function useInstitutionSearch(q: string) {
  return useQuery({
    queryKey: ["admission", "catalog-proposal-institutions", q] as const,
    enabled: q.trim().length >= 2,
    queryFn: ({ signal }) =>
      getApiClient()
        .get<{ items: InstitutionHit[] }>("/v1/admission/catalog/institutions", {
          query: { q: q.trim(), limit: 8 },
          signal,
        })
        .then((page) => page.items),
  })
}
