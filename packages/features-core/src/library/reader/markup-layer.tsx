"use client"

import type { MarkupShape, MarkupTool } from "@ihsp/api"
import { newClientId } from "./use-reader-annotations"
import { useRef, useState, type PointerEvent } from "react"
import { clampPoint, eraseAt, shapeFromDrag } from "./lib/markup"

/** What the user draws with now; `null` tool means the layer only shows the drawings and lets the page be used. */
export type MarkupDraw = {
  tool: MarkupTool | "eraser"
  color: string
  width: number
  onAdd(page: number, shape: MarkupShape): void
  onErase(page: number, id: string): void
}

type Point = [number, number]

const ERASER_TOLERANCE = 0.012

function strokeProps(shape: MarkupShape) {
  const base = { stroke: shape.color, strokeWidth: shape.width, fill: "none", strokeLinecap: "round" as const }
  switch (shape.tool) {
    case "pencil":
      return { ...base, strokeWidth: shape.width * 0.5, opacity: 0.75 }
    case "highlighter":
      return { ...base, strokeWidth: shape.width * 4, opacity: 0.35, strokeLinecap: "butt" as const }
    default:
      return base
  }
}

/** One drawing, in a box that is 1 wide and `aspect` high (the page, so the markup follows the zoom). */
function ShapeView({ shape, aspect }: { shape: MarkupShape; aspect: number }) {
  const pts = shape.points.map(([x, y]) => [x, y * aspect] as const)
  const props = strokeProps(shape)
  const first = pts[0]
  const last = pts.at(-1)
  if (!first || !last) return null
  switch (shape.tool) {
    case "rect":
      return (
        <rect
          data-shape={shape.tool}
          x={Math.min(first[0], last[0])}
          y={Math.min(first[1], last[1])}
          width={Math.abs(last[0] - first[0])}
          height={Math.abs(last[1] - first[1])}
          strokeLinejoin="round"
          {...props}
        />
      )
    case "ellipse":
      return (
        <ellipse
          data-shape={shape.tool}
          cx={(first[0] + last[0]) / 2}
          cy={(first[1] + last[1]) / 2}
          rx={Math.abs(last[0] - first[0]) / 2}
          ry={Math.abs(last[1] - first[1]) / 2}
          {...props}
        />
      )
    case "line":
    case "arrow": {
      const dx = last[0] - first[0]
      const dy = last[1] - first[1]
      const length = Math.hypot(dx, dy)
      const head = Math.min(length * 0.5, shape.width * 6)
      const angle = Math.atan2(dy, dx)
      const wing = (turn: number) =>
        `${last[0] - head * Math.cos(angle + turn)},${last[1] - head * Math.sin(angle + turn)}`
      return (
        <g data-shape={shape.tool} {...props} strokeLinejoin="round">
          <line x1={first[0]} y1={first[1]} x2={last[0]} y2={last[1]} />
          {shape.tool === "arrow" && length > 0 ? (
            <polyline points={`${wing(0.5)} ${last[0]},${last[1]} ${wing(-0.5)}`} />
          ) : null}
        </g>
      )
    }
    default:
      return (
        <polyline
          data-shape={shape.tool}
          points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
          strokeLinejoin="round"
          {...props}
        />
      )
  }
}

/**
 * The drawings of one PDF page over the page. With a tool chosen it also takes the pointer: a drag draws (or erases);
 * without one it lets everything through so the text can be selected. Points are fractions of the page.
 */
export function MarkupLayer({
  page,
  width,
  height,
  shapes,
  draw,
}: {
  page: number
  width: number
  height: number
  shapes: readonly MarkupShape[]
  draw: MarkupDraw | null
}) {
  const ref = useRef<SVGSVGElement>(null)
  const [live, setLive] = useState<Point[] | null>(null)
  const points = useRef<Point[]>([])
  const aspect = height / width

  function at(event: PointerEvent<SVGSVGElement>): Point {
    const rect = ref.current!.getBoundingClientRect()
    return clampPoint((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height)
  }

  function eraseHere(point: Point) {
    const id = eraseAt(shapes, point, ERASER_TOLERANCE, aspect)
    if (id) draw?.onErase(page, id)
  }

  function onDown(event: PointerEvent<SVGSVGElement>) {
    if (!draw || (event.pointerType === "mouse" && event.button !== 0)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = at(event)
    if (draw.tool === "eraser") {
      points.current = [point]
      eraseHere(point)
      return
    }
    points.current = [point]
    setLive([point])
  }

  function onMove(event: PointerEvent<SVGSVGElement>) {
    if (!draw || points.current.length === 0) return
    const point = at(event)
    if (draw.tool === "eraser") {
      eraseHere(point)
      return
    }
    points.current.push(point)
    setLive([...points.current])
  }

  function onUp() {
    if (!draw) return
    const drawn = points.current
    points.current = []
    setLive(null)
    if (draw.tool === "eraser" || drawn.length === 0) return
    const first = drawn[0]!
    const last = drawn.at(-1)!
    const moved = Math.hypot(last[0] - first[0], (last[1] - first[1]) * aspect) > 0.002
    // A tap draws a dot with a pen; a figure needs a drag.
    if (!moved && !["pen", "pencil", "highlighter"].includes(draw.tool)) return
    draw.onAdd(
      page,
      shapeFromDrag(draw.tool, draw.color, draw.width, drawn.length === 1 ? [first, first] : drawn, newClientId()),
    )
  }

  const preview =
    live && draw && draw.tool !== "eraser"
      ? shapeFromDrag(draw.tool, draw.color, draw.width, live.length === 1 ? [live[0]!, live[0]!] : live, "live")
      : null

  return (
    <svg
      ref={ref}
      data-markup-page={page}
      data-drawing={draw ? draw.tool : undefined}
      viewBox={`0 0 1 ${aspect}`}
      preserveAspectRatio="none"
      className="absolute inset-0 size-full"
      style={{
        pointerEvents: draw ? "auto" : "none",
        touchAction: draw ? "none" : undefined,
        cursor: draw ? "crosshair" : undefined,
        mixBlendMode: "multiply",
      }}
      aria-hidden
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {shapes.map((shape) => (
        <ShapeView key={shape.id} shape={shape} aspect={aspect} />
      ))}
      {preview ? <ShapeView shape={preview} aspect={aspect} /> : null}
    </svg>
  )
}
