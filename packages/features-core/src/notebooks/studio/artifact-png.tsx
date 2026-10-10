"use client"

import type { ArtifactDetail } from "@ihsp/api"
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"
import { renderNodeToPng } from "../viewers/infographic/dom-to-png"
import { InfographicCanvas } from "../viewers/infographic/infographic-canvas"
import { CANVAS_SIZES, orientationOf, styleOf } from "../viewers/infographic/infographic-theme"
import { measureContentScale } from "../viewers/infographic/shrink-to-fit"
import { svgToPngBlob } from "../viewers/mind-map/export-png"
import { LIGHT_PALETTE, buildMindMapSvg } from "../viewers/mind-map/export-svg"
import { layoutMindMap } from "../viewers/mind-map/layout"
import { measureNode } from "../viewers/mind-map/node-metrics"

/** The whole mind map (every branch open) as a PNG, drawn from its nodes without opening the viewer. */
async function mindMapPng(nodes: Extract<ArtifactDetail, { kind: "mind_map" }>["content"]): Promise<Blob> {
  if (!nodes || nodes.nodes.length === 0) throw new Error("empty")
  const { svg, width, height } = buildMindMapSvg(layoutMindMap(nodes.nodes, new Set(), measureNode), LIGHT_PALETTE)
  return svgToPngBlob(svg, width, height)
}

/** The infographic as a PNG: the canvas is mounted off screen at its fixed size, shrunk to fit like the viewer does. */
async function infographicPng(artifact: Extract<ArtifactDetail, { kind: "infographic" }>): Promise<Blob> {
  const content = artifact.content
  if (!content) throw new Error("empty")
  const orientation = orientationOf(artifact.options)
  const variant = styleOf(artifact.options)
  const { width, height } = CANVAS_SIZES[orientation]
  const host = document.createElement("div")
  host.style.cssText = "position:fixed;left:-100000px;top:0;pointer-events:none"
  document.body.append(host)
  const root = createRoot(host)
  try {
    const draw = (contentScale: number) =>
      flushSync(() =>
        root.render(
          <InfographicCanvas content={content} orientation={orientation} variant={variant} contentScale={contentScale} />,
        ),
      )
    draw(1)
    const canvas = host.firstElementChild
    if (!(canvas instanceof HTMLElement)) throw new Error("no-canvas")
    const scale = measureContentScale(canvas)
    if (scale < 1) draw(scale)
    return await renderNodeToPng(canvas, { width, height, scale: 2 })
  } finally {
    root.unmount()
    host.remove()
  }
}

/** A mind map or an infographic as a PNG; other kinds have no picture. */
export function artifactPng(artifact: ArtifactDetail): Promise<Blob> {
  if (artifact.kind === "mind_map") return mindMapPng(artifact.content)
  if (artifact.kind === "infographic") return infographicPng(artifact)
  return Promise.reject(new Error("no-picture"))
}
