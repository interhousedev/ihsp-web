"use client"

import { getApiClient } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export type WordCandidate = { word: string; reason: string; evidence_refs: string[] }

export type WordsState = {
  words: string[]
  candidates: WordCandidate[]
  source: "ai" | "manual" | "mixed" | null
  version: number
  confirmed_at: string | null
  lock_version: number | null
}

export const WORDS_KEY = ["admission", "words"] as const

export function fetchWords(): Promise<WordsState> {
  return getApiClient().get<WordsState>("/v1/admission/me/words")
}

export function putWords(words: string[], lockVersion: number | null): Promise<WordsState> {
  return getApiClient().put<WordsState>("/v1/admission/me/words", { words, lock_version: lockVersion })
}

export function suggestWords(): Promise<WordsState> {
  return getApiClient().post<WordsState>("/v1/admission/me/words/suggest")
}

export function useWords() {
  return useQuery({ queryKey: WORDS_KEY, queryFn: fetchWords })
}
