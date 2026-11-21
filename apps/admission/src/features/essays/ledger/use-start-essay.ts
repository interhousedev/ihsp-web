"use client"

import { useErrorMessage } from "@ihsp/i18n"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCreateEssay } from "../api"
import type { PromptGroup, PromptRef } from "../flow/api"
import { groupWordLimit } from "../flow/group-label"
import { isOwed } from "./ledger-model"

/** The most prompts one draft is written for. */
export const MAX_TARGETS = 5

/** The prompts a new draft answers: the student's own first, at most `MAX_TARGETS`. */
export function draftTargets(group: PromptGroup): PromptRef[] {
  return [...group.prompts].sort((a, b) => Number(isOwed(b)) - Number(isOwed(a))).slice(0, MAX_TARGETS)
}

/** Starts an essay for a whole prompt group and opens it in the editor. */
export function useStartEssay() {
  const router = useRouter()
  const create = useCreateEssay()
  const errorMessage = useErrorMessage()
  const start = (group: PromptGroup, title = "") => {
    const prompts = draftTargets(group)
    create.mutate(
      {
        kind: prompts.some((p) => p.institution_id) ? "supplemental" : "personal_statement",
        title: title.trim(),
        prompt_text: "",
        word_limit: groupWordLimit(group),
        targets: prompts.map((p) => ({ institution_id: p.institution_id, position: p.position })),
      },
      {
        onSuccess: (essay) => router.push(`/essays/edit/?id=${encodeURIComponent(essay.id)}`),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }
  /** A free essay with no prompt group; the prompt is typed in the editor. */
  const startBlank = () =>
    create.mutate(
      { kind: "other", title: "" },
      {
        onSuccess: (essay) => router.push(`/essays/edit/?id=${encodeURIComponent(essay.id)}`),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  return { start, startBlank, pending: create.isPending }
}
