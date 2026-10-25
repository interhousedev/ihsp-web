"use client"

import type { ArtifactDetail, InfographicContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useLayoutEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { copyText, fileNameFor } from "../../lib/download"
import { InfographicCanvas } from "./infographic-canvas"
import { InfographicPrintSheet } from "./infographic-print-sheet"
import { InfographicSources } from "./infographic-sources"
import { infographicToText } from "./infographic-text"
import { CANVAS_SIZES, orientationOf, styleOf } from "./infographic-theme"
import { InfographicToolbar } from "./infographic-toolbar"
import { measureContentScale } from "./shrink-to-fit"
import { useInfographicZoom } from "./use-infographic-zoom"
import { usePngExport } from "./use-png-export"

type InfographicStageProps = {
  artifact: Extract<ArtifactDetail, { kind: "infographic" }>
  content: InfographicContent
}

function printPage() {
  if (typeof window.print === "function") window.print()
}

/** The infographic viewer once the content is there: toolbar, the scaled canvas, the error line and the sources row. */
export function InfographicStage({ artifact, content }: InfographicStageProps) {
  const t = useT("notebooks.infographic")
  const tCommon = useT("common")
  const orientation = orientationOf(artifact.options)
  const variant = styleOf(artifact.options)
  const { width, height } = CANVAS_SIZES[orientation]
  const canvasRef = useRef<HTMLDivElement>(null)
  const [contentScale, setContentScale] = useState(1)
  const { containerRef, scale, isFit, zoomIn, zoomOut, fit } = useInfographicZoom(width)
  const png = usePngExport({
    canvasRef,
    width,
    height,
    fileName: fileNameFor(content.title || artifact.title, "png", "infographic"),
    onFallback: printPage,
  })

  // Taller content than the canvas (detailed infographics) is shrunk instead of being cut off.
  useLayoutEffect(() => {
    if (canvasRef.current) setContentScale(measureContentScale(canvasRef.current))
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- measure again when the content or the canvas size changes
  }, [content, orientation, variant])

  async function copy() {
    if (await copyText(infographicToText(content))) toast.success(tCommon("copied"))
  }

  return (
    <div className="flex flex-col gap-3">
      <InfographicToolbar
        scale={scale}
        isFit={isFit}
        busy={png.busy}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fit}
        onDownload={() => void png.run()}
        onPrint={printPage}
        onCopy={() => void copy()}
      />
      {png.failed ? (
        <p role="alert" className="text-destructive text-sm">
          {t("pngFailed")}
        </p>
      ) : null}
      <section aria-label={t("canvas")} className="bg-muted/40 overflow-x-auto rounded-xl border p-2 md:p-4">
        <div ref={containerRef} className="w-full">
          <div
            data-testid="infographic-scaler"
            data-scale={scale}
            className="mx-auto"
            style={{ width: width * scale, height: height * scale }}
          >
            <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <InfographicCanvas
                ref={canvasRef}
                content={content}
                orientation={orientation}
                variant={variant}
                contentScale={contentScale}
              />
            </div>
          </div>
        </div>
      </section>
      <InfographicSources blocks={content.blocks} refsIndex={artifact.refs_index} />
      <InfographicPrintSheet
        content={content}
        orientation={orientation}
        variant={variant}
        contentScale={contentScale}
      />
    </div>
  )
}
