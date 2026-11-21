"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { essayKeys, type Essay } from "../api"

/** The words of a text, the way the editor counts them. */
export const wordsOf = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

/** Loads an essay's text (from the cache when the editor already has it) and copies it as plain text. */
export function useEssayText() {
  const qc = useQueryClient()
  const t = useT("essayLedger")
  const load = (id: string) =>
    qc.fetchQuery({
      queryKey: essayKeys.one(id),
      staleTime: 30_000,
      queryFn: ({ signal }) => getApiClient().get<Essay>(`/v1/admission/essays/${seg(id)}`, { signal }),
    })
  const copy = async (id: string) => {
    try {
      const essay = await load(id)
      await navigator.clipboard.writeText(essay.body)
      toast.success(t("copied", { count: wordsOf(essay.body) }))
    } catch {
      toast.error(t("copyFailed"))
    }
  }
  return { load, copy }
}
