"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale } from "@ihsp/i18n"
import type { AdmissionMatchDecision as MatchDecision } from "@ihsp/api"
import {
  deleteDecision,
  getChances,
  getDefaultPrompt,
  getDismissed,
  getMatches,
  getUniChatSuggestions,
  openUniChat,
  postDecision,
  putDefaultPrompt,
} from "./api"

export const MATCH_LIMIT = 20

export function useMatches() {
  return useQuery({
    queryKey: ["admission", "matches", MATCH_LIMIT] as const,
    queryFn: ({ signal }) => getMatches(MATCH_LIMIT, signal),
  })
}

export function useDismissed() {
  return useQuery({
    queryKey: ["admission", "matches", "dismissed"] as const,
    queryFn: ({ signal }) => getDismissed(signal),
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

export const uniChatKey = (id: string) => ["admission", "uni-chat", id] as const

/** Opens (and on the first visit creates) the student's chat of one university; the answer is kept for the session. */
export function useUniChat(institutionId: string | undefined) {
  const locale = useLocale()
  return useQuery({
    queryKey: uniChatKey(institutionId ?? ""),
    enabled: Boolean(institutionId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () => openUniChat(institutionId as string, locale),
  })
}

export function useUniChatSuggestions(institutionId: string | undefined) {
  const locale = useLocale()
  return useQuery({
    queryKey: ["admission", "uni-chat-suggestions", institutionId ?? "", locale] as const,
    enabled: Boolean(institutionId),
    queryFn: ({ signal }) => getUniChatSuggestions(institutionId as string, locale, signal),
  })
}

export const DEFAULT_PROMPT_KEY = ["admission", "uni-chat-default-prompt"] as const

export function useDefaultPrompt(enabled = true) {
  return useQuery({ queryKey: DEFAULT_PROMPT_KEY, enabled, queryFn: ({ signal }) => getDefaultPrompt(signal) })
}

export function useSaveDefaultPrompt() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (prompt: string) => putDefaultPrompt(prompt),
    onSuccess: (saved) => client.setQueryData(DEFAULT_PROMPT_KEY, saved),
  })
}
