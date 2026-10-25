"use client"

import { getNotebookSourceFileUrl } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Skeleton, cn } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { createFileLinks } from "../../library/reader/lib/file-link"
import { loadPdfEngine } from "../../library/reader/lib/load-engines"
import { isCancelled, type PdfEngineLoader } from "../../library/reader/lib/pdf-types"

export type SourcePdfViewProps = {
  /** A notebook source renews its link through the notebook API; another file (a lesson material) keeps `url`. */
  notebookId?: string
  sourceId?: string
  name: string
  /** The presigned `inline` URL: the signature is in the query, no session token ever goes into it. */
  url: string
  /** `compact`: the window above the source guide; `full`: the dialog. */
  size: "compact" | "full"
  /** Tests replace the pdf.js engine with a fake. */
  engine?: PdfEngineLoader
  /** Tests force the first-page fallback. */
  inline?: boolean
}

/** False when the browser says it has no built-in PDF viewer (iOS Safari, most Android browsers). */
export function canShowPdfInline(): boolean {
  return typeof navigator === "undefined" || navigator.pdfViewerEnabled !== false
}

/**
 * A PDF source: the browser's own viewer in a frame (fit to width), or, where the browser has none, the first page
 * drawn by the library reader's pdf.js engine with a link to the whole file.
 */
export function SourcePdfView({ notebookId, sourceId, name, url, size, engine, inline }: SourcePdfViewProps) {
  const showInline = inline ?? canShowPdfInline()
  if (showInline) {
    return (
      // Chrome refuses to show a PDF in a sandboxed frame; the URL is our own storage's presigned link.
      // oxlint-disable-next-line react/iframe-missing-sandbox
      <iframe
        src={`${url}#view=FitH`}
        title={name}
        referrerPolicy="no-referrer"
        className={cn("w-full border-0 bg-white", size === "compact" ? "h-[40vh] min-h-48" : "size-full")}
      />
    )
  }
  return (
    <PdfFirstPage notebookId={notebookId} sourceId={sourceId} name={name} url={url} engine={engine ?? loadPdfEngine} />
  )
}

type FirstPageState = { status: "loading" } | { status: "ready"; pages: number } | { status: "failed" }

function PdfFirstPage({
  notebookId,
  sourceId,
  name,
  url,
  engine,
}: {
  notebookId?: string
  sourceId?: string
  name: string
  url: string
  engine: PdfEngineLoader
}) {
  const t = useT("notebooks")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<FirstPageState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | undefined
    const links = createFileLinks(() =>
      notebookId && sourceId
        ? getNotebookSourceFileUrl(notebookId, sourceId, { disposition: "inline" }).then((link) => ({
            content_type: "application/pdf",
            byte_size: 0,
            ...link,
          }))
        : Promise.resolve({
            url,
            expires_at: new Date(Date.now() + 3_600_000).toISOString(),
            content_type: "application/pdf",
            byte_size: 0,
          }),
    )
    void (async () => {
      const pdf = await engine()
      const doc = await pdf.open(links)
      cleanup = () => void doc.destroy()
      if (cancelled) return cleanup()
      const page = await doc.getPage(1)
      const canvas = canvasRef.current
      const width = canvas?.parentElement?.clientWidth || page.width
      if (canvas) await page.renderCanvas(canvas, width / page.width, window.devicePixelRatio || 1).promise
      if (!cancelled) setState({ status: "ready", pages: doc.pageCount })
    })().catch((error: unknown) => {
      if (!cancelled && !isCancelled(error)) setState({ status: "failed" })
    })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [engine, notebookId, sourceId, url])

  return (
    <div className="flex size-full min-h-0 flex-col items-center gap-2 overflow-auto p-2">
      {state.status === "loading" ? <Skeleton className="h-48 w-full" /> : null}
      {state.status === "failed" ? (
        <p className="text-muted-foreground p-4 text-center text-sm">{t("viewer.filePreview.pdfFallback")}</p>
      ) : (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={name}
          className={cn("max-w-full bg-white shadow-sm", state.status !== "ready" && "hidden")}
        />
      )}
      {state.status === "ready" ? (
        <p className="text-muted-foreground text-xs">{t("viewer.filePreview.pdfFirstPage", { count: state.pages })}</p>
      ) : null}
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline">
        {t("viewer.filePreview.pdfOpenTab")}
      </a>
    </div>
  )
}
