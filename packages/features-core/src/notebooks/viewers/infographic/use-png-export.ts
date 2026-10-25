"use client"

import { useState, type RefObject } from "react"
import { downloadBlob } from "../../lib/download"
import { renderNodeToPng } from "./dom-to-png"

type PngExportParams = {
  canvasRef: RefObject<HTMLElement | null>
  width: number
  height: number
  fileName: string
  /** Called when the picture cannot be made (open the print dialog instead). */
  onFallback: () => void
  /** Replaceable in tests. */
  render?: typeof renderNodeToPng
  save?: (fileName: string, blob: Blob) => void
}

/** Download PNG: renders the canvas, saves it, and on failure falls back (print) and reports `failed`. */
export function usePngExport({
  canvasRef,
  width,
  height,
  fileName,
  onFallback,
  render = renderNodeToPng,
  save = downloadBlob,
}: PngExportParams) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function run() {
    const node = canvasRef.current
    if (!node || busy) return
    setBusy(true)
    setFailed(false)
    try {
      save(fileName, await render(node, { width, height, scale: 2 }))
    } catch {
      setFailed(true)
      onFallback()
    } finally {
      setBusy(false)
    }
  }

  return { busy, failed, run }
}
