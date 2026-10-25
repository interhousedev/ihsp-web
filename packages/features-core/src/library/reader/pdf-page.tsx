"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton } from "@ihsp/ui"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { HighlightLayer } from "./highlight-layer"
import { isCancelled, type PdfDocumentHandle, type PdfPageHandle } from "./lib/pdf-types"
import type { ViewAnnotation } from "./use-reader-annotations"

export type PdfPageProps = {
  doc: PdfDocumentHandle
  number: number
  /** CSS pixels per PDF point. */
  scale: number
  /** The size the box has now (the real size once the page was loaded, else an estimate). */
  width: number
  height: number
  top: number
  onSize(number: number, size: { width: number; height: number }): void
  annotations: readonly ViewAnnotation[]
  searchText: string | null
  onNoteClick(id: string): void
}

/**
 * One page of the PDF: a canvas, the text layer on top of it (selectable, and what a screen reader reads) and the
 * highlights of this page. It draws when it is mounted and when the zoom changes, and gives its memory back when it
 * goes out of the window (the column unmounts pages far from the window).
 */
export const PdfPage = memo(function PdfPage({
  doc,
  number,
  scale,
  width,
  height,
  top,
  onSize,
  annotations,
  searchText,
  onNoteClick,
}: PdfPageProps) {
  const t = useT("library.reader")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const [textRoot, setTextRoot] = useState<HTMLDivElement | null>(null)
  const [drawn, setDrawn] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let page: PdfPageHandle | null = null
    const tasks: { cancel(): void }[] = []
    setFailed(false)
    ;(async () => {
      try {
        page = await doc.getPage(number)
        if (cancelled) return
        onSize(number, { width: page.width, height: page.height })
        const canvas = canvasRef.current
        if (!canvas || !textRoot) return
        const canvasTask = page.renderCanvas(canvas, scale, window.devicePixelRatio || 1)
        const textTask = page.renderTextLayer(textRoot, scale)
        tasks.push(canvasTask, textTask)
        await Promise.all([canvasTask.promise, textTask.promise])
        if (!cancelled) setDrawn((count) => count + 1)
      } catch (error) {
        if (!cancelled && !isCancelled(error)) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
      for (const task of tasks) task.cancel()
      page?.release()
    }
  }, [doc, number, scale, onSize, textRoot])

  const ownAnnotations = useMemo(
    () => annotations.filter((annotation) => annotation.kind !== "bookmark" && annotation.quote),
    [annotations],
  )

  return (
    <div
      ref={setBox}
      data-page={number}
      role="group"
      aria-label={t("pageLabel", { page: number })}
      className="ihsp-pdf-page bg-card absolute inset-x-0 mx-auto overflow-hidden rounded-sm shadow-sm ring-1 ring-black/10"
      style={{ top, width, height }}
    >
      {drawn === 0 && !failed ? <Skeleton className="absolute inset-0 rounded-none" aria-hidden /> : null}
      {failed ? (
        <p
          role="alert"
          className="text-destructive absolute inset-0 flex items-center justify-center p-4 text-center text-sm"
        >
          {t("pageError", { page: number })}
        </p>
      ) : null}
      <canvas ref={canvasRef} aria-hidden className="block" />
      <div ref={setTextRoot} className="ihsp-text-layer" />
      <HighlightLayer
        textRoot={textRoot}
        anchor={box}
        annotations={ownAnnotations}
        searchText={searchText}
        onNoteClick={onNoteClick}
        version={drawn}
        multiply
      />
    </div>
  )
})
