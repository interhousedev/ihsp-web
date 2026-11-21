"use client"

import { useT } from "@ihsp/i18n"
import { METRIC_STYLE } from "../../fit/fit-model"
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import {
  clampRating,
  pickAxis,
  radarPoint,
  RATING_MAX,
  RATING_MIN,
  TRAIT_AXIS,
  TRAITS,
  type Pt,
  type Ratings,
  type TraitId,
} from "../weights-model"

/** Scale at 375px is about 0.7 of these units, so labels are 16 units and wrap on spaces. */
const CX = 260
const CY = 180
const R = 110
const LABEL_GAP = 14
const VB = { x: 0, y: 0, w: 520, h: 360 }
const RINGS = Array.from({ length: RATING_MAX }, (_, i) => i + 1)

/** Wraps a label into at most two lines of about 13 characters, on spaces. */
function wrap(label: string): string[] {
  const words = label.split(" ")
  const lines: string[] = []
  for (const word of words) {
    const last = lines[lines.length - 1]
    if (last !== undefined && `${last} ${word}`.length <= 13) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines
}

/**
 * Eight traits on a radar, each rated 1-10. Drag from a vertex (or press anywhere): the axis nearest the pointer takes
 * the rating its distance from the centre stands for, so a tap on a ring step sets that step. Each vertex is a slider
 * for the keyboard (arrows ±1, Home/End to the ends). Controlled: the page owns the ratings.
 */
export function RadarPicker({ value, onChange }: { value: Ratings; onChange: (next: Ratings) => void }) {
  const t = useT("weightsLab")
  const svg = useRef<SVGSVGElement>(null)
  const axis = useRef<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const locate = (event: PointerEvent<SVGSVGElement>): Pt => {
    const box = svg.current!.getBoundingClientRect()
    return { x: VB.x + ((event.clientX - box.left) / box.width) * VB.w, y: VB.y + ((event.clientY - box.top) / box.height) * VB.h }
  }
  const set = (trait: TraitId, rating: number) => {
    const next = clampRating(rating)
    if (next !== value[trait]) onChange({ ...value, [trait]: next })
  }
  const onDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    const picked = pickAxis(locate(event), R, CX, CY)
    axis.current = picked.index
    setDragIndex(picked.index)
    set(TRAITS[picked.index]!, picked.value)
  }
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    if (axis.current === null) return
    set(TRAITS[axis.current]!, pickAxis(locate(event), R, CX, CY).value)
  }
  const end = () => {
    axis.current = null
    setDragIndex(null)
  }
  const onKey = (trait: TraitId) => (event: KeyboardEvent<SVGGElement>) => {
    const target: Record<string, number> = {
      ArrowUp: value[trait] + 1,
      ArrowRight: value[trait] + 1,
      ArrowDown: value[trait] - 1,
      ArrowLeft: value[trait] - 1,
      Home: RATING_MIN,
      End: RATING_MAX,
    }
    if (!(event.key in target)) return
    event.preventDefault()
    set(trait, target[event.key]!)
  }

  const shape = TRAITS.map((trait, i) => radarPoint(i, value[trait], R, CX, CY))
  return (
    <div className="flex flex-col gap-2">
      <svg
        ref={svg}
        viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
        className="mx-auto w-full max-w-[34rem] touch-none select-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <title>{t("radar.label")}</title>
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={TRAITS.map((_, i) => radarPoint(i, ring, R, CX, CY)).map((p) => `${p.x},${p.y}`).join(" ")}
            className={ring % 5 === 0 ? "stroke-hairline-strong fill-none" : "stroke-border fill-none"}
            strokeWidth={ring % 5 === 0 ? 1.2 : 0.6}
          />
        ))}
        {TRAITS.map((trait, i) => {
          const edge = radarPoint(i, RATING_MAX, R, CX, CY)
          return <line key={trait} x1={CX} y1={CY} x2={edge.x} y2={edge.y} className="stroke-border" strokeWidth={0.8} />
        })}
        <polygon
          points={shape.map((p) => `${p.x},${p.y}`).join(" ")}
          className="fill-foreground/5 stroke-foreground/60 transition-[points] duration-150"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {TRAITS.map((trait, i) => {
          const p = shape[i]!
          const out = radarPoint(i, RATING_MAX, R + LABEL_GAP, CX, CY)
          const anchor = Math.abs(out.x - CX) < 6 ? "middle" : out.x > CX ? "start" : "end"
          const lines = wrap(t(`trait.${trait}`))
          const top = out.y - (out.y < CY - 6 ? (lines.length - 1) * 17 : out.y > CY + 6 ? -6 : (lines.length - 1) * 8)
          return (
            <g key={trait}>
              <text x={out.x} y={top + 4} textAnchor={anchor} className="fill-foreground text-[16px] font-medium">
                {lines.map((line, n) => (
                  <tspan key={n} x={out.x} dy={n === 0 ? 0 : 17}>
                    {line}
                  </tspan>
                ))}
              </text>
              <g
                tabIndex={0}
                role="slider"
                aria-label={t(`trait.${trait}`)}
                aria-valuemin={RATING_MIN}
                aria-valuemax={RATING_MAX}
                aria-valuenow={value[trait]}
                aria-valuetext={t("radar.value", { trait: t(`trait.${trait}`), value: value[trait] })}
                onKeyDown={onKey(trait)}
                className="group cursor-grab outline-none active:cursor-grabbing"
              >
                <circle cx={p.x} cy={p.y} r={20} className="fill-transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={dragIndex === i ? 14 : 12}
                  className="stroke-background group-focus-visible:stroke-ring transition-[r] duration-150"
                  style={{ fill: METRIC_STYLE[TRAIT_AXIS[trait]].color }}
                  strokeWidth={2.5}
                />
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="fill-white pointer-events-none text-[12px] font-semibold">
                  {value[trait]}
                </text>
              </g>
            </g>
          )
        })}
      </svg>
      <p className="text-muted-foreground text-xs">{t("radar.hint")}</p>
    </div>
  )
}
