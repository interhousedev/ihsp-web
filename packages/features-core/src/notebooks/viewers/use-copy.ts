"use client"

import { useT } from "@ihsp/i18n"
import { useCallback } from "react"
import { toast } from "sonner"
import { copyText } from "../lib/download"

/** Copies text to the clipboard and answers with a toast ("Copied" or the generic error). */
export function useCopy(): (text: string) => Promise<void> {
  const t = useT()
  return useCallback(
    async (text: string) => {
      if (await copyText(text)) toast.success(t("common.copied"))
      else toast.error(t("errors.generic"))
    },
    [t],
  )
}
