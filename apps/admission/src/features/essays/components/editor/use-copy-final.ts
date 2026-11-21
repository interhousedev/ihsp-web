"use client"

import { useT } from "@ihsp/i18n"
import { toast } from "sonner"
import { countWords } from "../../diff"

/** Copies the draft as plain text, ready to paste into an application form, and confirms with the word count. */
export function useCopyFinal(body: string) {
  const t = useT("essayEditor")
  return async () => {
    try {
      await navigator.clipboard.writeText(body)
      toast.success(t("copied", { count: countWords(body) }))
    } catch {
      toast.error(t("copyFailed"))
    }
  }
}
