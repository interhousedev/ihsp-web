"use client"

import { useT } from "@ihsp/i18n"
import { useCallback, useState, type RefObject } from "react"
import { toast } from "sonner"
import { copyText, downloadText, fileNameFor } from "../../lib/download"
import { downloadMindMapPng } from "./export-png"
import type { MindMapLayout } from "./layout"

type ExportArgs = {
  title: string
  layout: MindMapLayout
  /** The Markdown outline of the whole map. */
  outline: string
  /** Element whose computed theme colours are used for the image. */
  host: RefObject<HTMLElement | null>
}

/** Download PNG, download the outline as Markdown, and copy the outline (the fallback inside Telegram). */
export function useMindMapExport({ title, layout, outline, host }: ExportArgs) {
  const t = useT("notebooks")
  const common = useT()
  const [error, setError] = useState<string | null>(null)

  const downloadPng = useCallback(async () => {
    setError(null)
    try {
      if (!host.current) throw new Error("no-host")
      await downloadMindMapPng(layout, title, host.current)
    } catch {
      setError(t("mindmap.exportFailed"))
    }
  }, [layout, title, host, t])

  const downloadOutline = useCallback(() => {
    setError(null)
    downloadText(fileNameFor(title, "md"), `${outline}\n`, "text/markdown;charset=utf-8")
  }, [title, outline])

  const copyOutline = useCallback(async () => {
    setError(null)
    if (await copyText(outline)) toast.success(common("common.copied"))
    else toast.error(common("errors.generic"))
  }, [outline, common])

  return { error, downloadPng, downloadOutline, copyOutline }
}
