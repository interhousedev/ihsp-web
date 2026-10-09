"use client"

import { useCallback, useEffect, useState } from "react"
import type { FileLinks } from "./lib/file-link"
import type { PdfDocumentHandle, PdfEngineLoader } from "./lib/pdf-types"

export type PdfDocumentState =
  | { status: "loading" }
  | { status: "ready"; doc: PdfDocumentHandle }
  | { status: "error"; error: unknown }

/**
 * Loads the PDF engine (pdf.js, a dynamic import) and opens the document through the file links. The document is
 * destroyed when the reader goes away. `retry` opens it again with a new link.
 */
export function usePdfDocument(links: FileLinks, loadEngine: PdfEngineLoader): [PdfDocumentState, () => void] {
  const [state, setState] = useState<PdfDocumentState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let opened: PdfDocumentHandle | null = null
    setState({ status: "loading" })
    ;(async () => {
      try {
        const engine = await loadEngine()
        const doc = await engine.open(links, {
          onError: (error) => {
            if (!cancelled) setState({ status: "error", error })
          },
        })
        if (cancelled) {
          void doc.destroy()
          return
        }
        opened = doc
        setState({ status: "ready", doc })
      } catch (error) {
        if (!cancelled) setState({ status: "error", error })
      }
    })()
    return () => {
      cancelled = true
      void opened?.destroy()
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `attempt` is only a trigger: Retry changes it to open the document again
  }, [links, loadEngine, attempt])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])
  return [state, retry]
}
