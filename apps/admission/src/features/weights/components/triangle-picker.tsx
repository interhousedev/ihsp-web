"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { baryToPoint, CENTRE, CORNERS, pointToBary, sameBary, snapTo, SNAPS, VERTEX, type Bary, type Pt } from "../weights-model"

const VIEW = { w: 320, h: 290 }
const SNAP_RADIUS = 13
const KEY_STEP = 9
const POLYGON = CORNERS.map((c) => `${VERTEX[c].x},${VERTEX[c].y}`).join(" ")
const LABEL: Record<(typeof CORNERS)[number], { x: number; y: number; anchor: "start" | "middle" | "end" }> = {
  profession: { x: 160, y: 20, anchor: "middle" },
  study: { x: 4, y: 272, anchor: "start" },
  social: { x: 316, y: 272, anchor: "end" },
}
const CHIPS: { id: string; bary: Bary }[] = [
  { id: "balanced", bary: CENTRE },
  { id: "social", bary: { profession: 0, study: 0, social: 1 } },
  { id: "study", bary: { profession: 0, study: 1, social: 0 } },
  { id: "profession", bary: { profession: 1, study: 0, social: 0 } },
]

/**
 * A point inside a triangle whose corners are Social life, Study and Profession: the closer to a corner, the more it
 * matters. Pointer and touch drag (and tap to jump), arrow keys nudge, the point snaps to the centre, corners and
 * edge midpoints. Controlled: the page owns the barycentric value.
 */
export function TrianglePicker({ value, onChange }: { value: Bary; onChange: (next: Bary) => void }) {
  const t = useT("weightsLab.triangle")
  const svg = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)
  const point = baryToPoint(value)

  const locate = (event: PointerEvent<SVGSVGElement>): Pt => {
    const box = svg.current!.getBoundingClientRect()
    return { x: ((event.clientX - box.left) / box.width) * VIEW.w, y: ((event.clientY - box.top) / box.height) * VIEW.h }
  }
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const p = locate(event)
    onChange(snapTo(p, SNAP_RADIUS) ?? pointToBary(p))
  }
  const onKey = (event: KeyboardEvent<SVGGElement>) => {
    const delta: Record<string, Pt> = {
      ArrowLeft: { x: -KEY_STEP, y: 0 },
      ArrowRight: { x: KEY_STEP, y: 0 },
      ArrowUp: { x: 0, y: -KEY_STEP },
      ArrowDown: { x: 0, y: KEY_STEP },
    }
    if (event.key === "Home") {
      event.preventDefault()
      onChange(CENTRE)
      return
    }
    const d = delta[event.key]
    if (!d) return
    event.preventDefault()
    onChange(pointToBary({ x: point.x + d.x, y: point.y + d.y }))
  }
  const pct = (corner: (typeof CORNERS)[number]) => Math.round(value[corner] * 100)

  return (
    <div className="flex flex-col gap-3">
      <svg
        ref={svg}
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="mx-auto w-full max-w-[26rem] touch-none select-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
          move(event)
        }}
        onPointerMove={(event) => dragging && move(event)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <title>{t("label")}</title>
        <polygon points={POLYGON} className="fill-primary/5 stroke-hairline-strong" strokeWidth={1.5} strokeLinejoin="round" />
        {CORNERS.map((corner) => (
          <line
            key={corner}
            x1={VERTEX[corner].x}
            y1={VERTEX[corner].y}
            x2={baryToPoint(CENTRE).x}
            y2={baryToPoint(CENTRE).y}
            className="stroke-border"
            strokeDasharray="3 5"
          />
        ))}
        {SNAPS.map((snap, index) => {
          const p = baryToPoint(snap)
          return <circle key={index} cx={p.x} cy={p.y} r={sameBary(snap, value) ? 0 : 3} className="fill-muted-foreground/40" />
        })}
        {CORNERS.map((corner) => (
          <text
            key={corner}
            x={LABEL[corner].x}
            y={LABEL[corner].y}
            textAnchor={LABEL[corner].anchor}
            className={cn("fill-foreground text-[13px] font-medium", pct(corner) >= 50 && "fill-primary")}
          >
            {t(`corner.${corner}`)} · {pct(corner)}%
          </text>
        ))}
        <g
          tabIndex={0}
          role="slider"
          aria-label={t("label")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct("profession")}
          aria-valuetext={t("value", { social: pct("social"), study: pct("study"), profession: pct("profession") })}
          onKeyDown={onKey}
          className="group cursor-grab outline-none active:cursor-grabbing"
        >
          <circle cx={point.x} cy={point.y} r={26} className="fill-transparent" />
          <circle
            cx={point.x}
            cy={point.y}
            r={dragging ? 17 : 14}
            className="fill-primary/20 group-focus-visible:stroke-ring transition-[r] duration-150"
            strokeWidth={2.5}
          />
          <circle cx={point.x} cy={point.y} r={9} className="fill-primary stroke-background" strokeWidth={2.5} />
        </g>
      </svg>
      <div role="group" aria-label={t("chipsLabel")} className="flex flex-wrap justify-center gap-1.5">
        {CHIPS.map(({ id, bary }) => (
          <button
            key={id}
            type="button"
            aria-pressed={sameBary(bary, value)}
            onClick={() => onChange(bary)}
            className={cn(
              "focus-visible:ring-ring min-h-9 rounded-full border px-3 text-xs font-medium outline-none focus-visible:ring-2",
              sameBary(bary, value) ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/40",
            )}
          >
            {t(id === "balanced" ? "balanced" : `corner.${id}`)}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground text-center text-xs">{t("hint")}</p>
    </div>
  )
}
