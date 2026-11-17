"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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

export const proofKeys = {
  list: (itemId: string) => ["admission", "proofs", itemId] as const,
}

const BASE = "/v1/admission"

export function useProofs(itemId: string) {
  return useQuery({
    queryKey: proofKeys.list(itemId),
    queryFn: () => getApiClient().get<{ items: Proof[] }>(`${BASE}/items/${seg(itemId)}/proofs`),
    // A proof is checked in the background: poll while one is pending.
    refetchInterval: (query) => (query.state.data?.items.some((p) => p.status === "pending") ? 4000 : false),
  })
}

export function useAddProof(itemId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: ProofInput) => getApiClient().post<Proof>(`${BASE}/items/${seg(itemId)}/proofs`, input),
    onSuccess: () => client.invalidateQueries({ queryKey: proofKeys.list(itemId) }),
  })
}
