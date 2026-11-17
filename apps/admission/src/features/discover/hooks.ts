"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale } from "@ihsp/i18n"
import type { AdmissionMatchDecision as MatchDecision } from "@ihsp/api"
import { deleteDecision, getChances, getMatches, postDecision } from "./api"

export const MATCH_LIMIT = 20

export function useMatches() {
  return useQuery({
    queryKey: ["admission", "matches", MATCH_LIMIT] as const,
    queryFn: ({ signal }) => getMatches(MATCH_LIMIT, signal),
  })
}

export function useDecide() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: MatchDecision }) => postDecision(id, decision),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["admission", "matches"] })
      void client.invalidateQueries({ queryKey: ["admission", "list"] })
    },
  })
}

export function useUndoDecision() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDecision(id),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["admission", "matches"] })
      void client.invalidateQueries({ queryKey: ["admission", "list"] })
    },
  })
}

export function useChances(id: string | null) {
  return useQuery({
    queryKey: ["admission", "chances", id] as const,
    queryFn: ({ signal }) => getChances(id as string, signal),
    enabled: Boolean(id),
  })
}
