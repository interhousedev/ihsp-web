"use client"

import { useT } from "@ihsp/i18n"
import type { Ikigai, IkigaiCircle } from "../api"
import { CIRCLE_COLOR, CIRCLES } from "../model"

const R = 84
const CENTERS: Record<IkigaiCircle, { x: number; y: number; lx: number; ly: number }> = {
  love: { x: 180, y: 112, lx: 180, ly: 60 },
  good_at: { x: 116, y: 176, lx: 70, ly: 172 },
  needs: { x: 244, y: 176, lx: 290, ly: 172 },
  paid: { x: 180, y: 240, lx: 180, ly: 296 },
}

/** The four ikigai circles as one Venn; a circle is a button that selects it for editing. */
export function IkigaiVenn({
  ikigai,
  active,
  onSelect,
}: {
  ikigai: Ikigai
  active: IkigaiCircle
  onSelect: (circle: IkigaiCircle) => void
}) {
  const t = useT("professions")
  return (
    <svg viewBox="0 0 360 350" role="group" aria-label={t("venn.label")} className="mx-auto h-auto w-full max-w-sm">
      {CIRCLES.map((id) => {
        const c = CENTERS[id]
        const selected = id === active
        return (
          <circle
            key={id}
            cx={c.x}
            cy={c.y}
            r={R}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`${t(`circle.${id}`)}: ${ikigai[id].length}`}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelect(id)
              }
            }}
            fill={CIRCLE_COLOR[id]}
            fillOpacity={selected ? 0.34 : 0.18}
            stroke={CIRCLE_COLOR[id]}
            strokeWidth={selected ? 3 : 1.5}
            className="focus-visible:stroke-foreground cursor-pointer outline-none transition-[fill-opacity]"
          />
        )
      })}
      {CIRCLES.map((id) => {
        const c = CENTERS[id]
        const lines = t(`circle.${id}`).split(" ")
        return (
          <text key={id} textAnchor="middle" className="fill-foreground pointer-events-none text-[13px] font-semibold">
            {lines.map((line, i) => (
              <tspan key={line} x={c.lx} y={c.ly + i * 15 - ((lines.length - 1) * 15) / 2}>
                {line}
              </tspan>
            ))}
            <tspan x={c.lx} y={c.ly + (lines.length * 15) / 2 + 6} className="fill-muted-foreground text-[11px] font-normal">
              {ikigai[id].length}/8
            </tspan>
          </text>
        )
      })}
      <text x={180} y={182} textAnchor="middle" className="fill-foreground pointer-events-none text-[12px] font-bold">
        {t("venn.center")}
      </text>
    </svg>
  )
}
